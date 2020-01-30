import { Query, Ctx, Args, Resolver, Arg, Mutation } from 'type-graphql';
import { verifyAccess, formatSearchTerm, formatLuceneQueryForDate, Roles, createAndSendException } from '@/helpers/utils';
import { Context } from '@/helpers/interfaces';

import {
  Commission,
  GetCommission,
  GetAllCommissions,
  DownloadCommissions,
  CommissionTotal,
  ManualCommissionInput,
  CommissionRevenueShare,
  CommissionResult,
  RemoveCommissionArgs,
  MarkCommissionInput,
  CommissionInput,
} from '@/types/commission';
import { QueryStatistics, Item, DeleteByQueryOperation, IndexQuery } from 'ravendb';
import { DateTime, Duration } from 'luxon';
import moment = require('moment');
import { StripeWebhook } from '@/types/stripe';
import { OrderReference, Order } from '@/types/order';
import { User, UserReference } from '@/types/user';
import { Product, ProductReference } from '@/types/product';

const getNextDayOfWeek = (date: Date, dayOfWeek: number, daysToAdd: number = 7) => {
  const resultDate = moment(date)
    .startOf('day')
    .add(daysToAdd, 'd')
    .toDate();
  resultDate.setDate(resultDate.getDate() + ((daysToAdd + dayOfWeek - date.getDay()) % 7));
  return resultDate;
};

@Resolver(() => Commission)
export class CommissionResolver {
  @Query(() => GetAllCommissions)
  async getAllCommissionsByUser(
    @Args() { skip, pageSize }: GetCommission,
    @Ctx()
    { session, req }: Context
  ): Promise<GetAllCommissions> {
    verifyAccess(req, [Roles.Affiliate, Roles.CoinMD]);
    let stats: QueryStatistics;
    const userId: string = req.user.id;
    const commissions = await session
      .query<Commission>({ collection: 'Commissions' })
      .statistics(s => (stats = s))
      .whereEquals('affiliate.id', userId)
      .orderByDescending('createdAt')
      .skip(skip ? skip : 0)
      .take(pageSize)
      .all();
    const totalPaidCommission: CommissionTotal = await session
      .query<CommissionTotal>({ indexName: 'TotalCommissionsPaidByUserId' })
      .whereEquals('userId', userId)
      .firstOrNull();
    const totalPendingCommission: CommissionTotal = await session
      .query<CommissionTotal>({ indexName: 'TotalCommissionsPendingByUserId' })
      .whereEquals('userId', userId)
      .firstOrNull();
    return {
      commissions,
      totalRows: stats.totalResults,
      totalCommissionPaid: totalPaidCommission ? totalPaidCommission.commissionAmount : 0,
      totalCommissionPending: totalPendingCommission ? totalPendingCommission.commissionAmount : 0,
    };
  }

  @Query(() => Commission)
  async getCommissionById(@Arg('id') id: string, @Ctx() { session, req }: Context): Promise<Commission> {
    verifyAccess(req, [Roles.Administrator]);
    return session.load<Commission>(id);
  }
  @Query(() => GetAllCommissions)
  async getAllCommissions(
    @Args() { skip, pageSize, isAffiliate, searchText, dateFilter }: GetCommission,
    @Ctx() { session, req }: Context
  ): Promise<GetAllCommissions> {
    verifyAccess(req, [Roles.Administrator]);
    const searchTerm = formatSearchTerm(searchText.split(' '));
    const luceneQuery = formatLuceneQueryForDate(dateFilter);
    let stats: QueryStatistics;
    try {
      let query = await session
        .query<Commission>({ indexName: 'Commissions' })
        .statistics(s => (stats = s))
        .whereLucene('payCommissionOn', luceneQuery || '*');
      if (searchText) {
        query = query.andAlso().search('Query', searchTerm, 'AND');
      }
      if (isAffiliate) {
        query = query.andAlso().whereEquals('affiliate.id', req.user.id);
      }
      const commissions: Commission[] = await query
        .orderByDescending('createdAt')
        .skip(skip ? skip : 0)
        .take(pageSize)
        .all();
      for (const com of commissions) {
        // console.log('---', com);
      }
      return { commissions: commissions, totalRows: stats.totalResults, totalCommissionPending: 0, totalCommissionPaid: 0 };
    } catch (ex) {
      console.error(ex);
      throw Error(ex);
    }
  }

  @Query(() => [DownloadCommissions])
  async downloadCommissions(@Ctx() { session, req }: Context): Promise<DownloadCommissions[]> {
    const start = DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate();
    const end = DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0))
      .plus(1000 * 60)
      .toJSDate();
    return session
      .query<DownloadCommissions>({ indexName: 'CommissionsPendingByAffiliate' })
      .whereBetween('payCommissionOn', start, end)
      .all();
  }
  // Mutation
  // @Mutation(() => Commission)
  // async addCommission(
  //   @Arg('args') args: CommissionInput,
  //   @Ctx()
  //   { session, req }: Context
  // ): Promise<Commission> {
  //   try {
  //     verifyAccess(req, [Roles.Administrator]);
  //     //const { commission: commissionInput } = args;
  //     const commission: Commission = new Commission(
  //       args.payCommissionOn,
  //       args.commissionAmount,
  //       args.status,
  //       args.customer,
  //       args.affiliate,
  //       args.invoice,
  //       args.order,
  //       args.tier,
  //       args.revenueShare
  //     );
  //     await session.store(commission);
  //     await session.saveChanges();
  //     return commission;
  //   } catch (ex) {
  //     await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
  //     await session.saveChanges();
  //     throw new Error('There was an error. Please try again. The Tech Team has been notified.');
  //   }
  // }

  @Mutation(() => Commission)
  async addManualCommission(@Arg('args', () => ManualCommissionInput) args: ManualCommissionInput, @Ctx() { session, req }: Context): Promise<Commission> {
    try {
      verifyAccess(req, [Roles.Administrator]);
      const customer: User = await session.load<User>(args.customerId);
      const affiliate: User = await session.load<User>(args.affiliateId);
      const product: Product = await session.load<Product>(args.product);
      const customerReference = new UserReference(customer.id, customer.email, customer.firstName, customer.lastName);
      const affiliateReference = new UserReference(affiliate.id, affiliate.email, affiliate.firstName, affiliate.lastName);
      const productReference = new ProductReference(product.id, product.name, product.displayName, product.amount, product.plan.interval, product.setup);
      let order: Order = null;
      order = new Order(
        null,
        null,
        [productReference],
        Number(args.commissionAmount),
        customerReference,
        affiliateReference,
        {
          id: 'domains/1-A',
          tld: 'mytripvalet.com',
        },
        null,
        null,
        []
      );
      order.isRevenueShare = false;
      await session.store(order);
      const orderReference = new OrderReference(order.id, order.products, order.totalAmount);
      const commission = new Commission(
        DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate(),
        Number(args.commissionAmount),
        'Pending',
        customerReference,
        affiliateReference,
        null, // invoice,
        orderReference, // commissionInput.order,
        null, // commissionInput.tier,
        new CommissionRevenueShare(false, null)
      );
      await session.store(commission);
      await session.saveChanges();
      return commission;
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech Team has been notified.');
    }
  }

  @Mutation(() => Commission)
  async editCommission(@Arg('args') args: CommissionInput, @Ctx() { session, req }: Context): Promise<Commission> {
    verifyAccess(req, [Roles.Administrator]);
    try {
      let commission = await session.load<Commission>(args.id);
      if (!commission) {
        return null;
      }
      // tslint:disable-next-line:prefer-object-spread
      commission = Object.assign(commission, { ...args });
      await session.saveChanges();
      return commission;
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech team has been notified.');
    }
  }

  @Mutation(() => CommissionResult)
  async removeCommission(@Arg('args') args: RemoveCommissionArgs, @Ctx() { session, req, store }: Context): Promise<CommissionResult> {
    try {
      verifyAccess(req, [Roles.Administrator]);
      const { commissionId, orderId } = args;
      const commissionsCount = await session
        .query<Commission>({ indexName: 'Commissions' })
        .whereEquals('orderId', orderId)
        .count();
      if (commissionsCount === 1) {
        const stripeWebhook = await session
          .query<StripeWebhook>({ collection: 'StripeWebhooks' })
          .whereEquals('orderId', orderId)
          .firstOrNull();
        if (stripeWebhook) await session.delete(stripeWebhook);
        await session.delete(orderId);
        const indexQuery = new IndexQuery();
        indexQuery.query = `from index Commissions where orderId = '${orderId}'`;
        const operation = new DeleteByQueryOperation(indexQuery);
        const asyncOp = await store.operations.send(operation);
        await asyncOp.waitForCompletion();
      } else {
        const commission: Commission = await session.load<Commission>(commissionId);
        if (commission) session.delete(commission);
      }
      await session.saveChanges();
      return { success: true, message: 'deleted' };
    } catch (e) {
      // console.log(e);
      return { success: false, message: e };
    }
  }

  @Mutation(() => Boolean)
  async markCommissionAsPaid(@Arg('args') args: MarkCommissionInput, @Ctx() { session, req }: Context): Promise<boolean> {
    verifyAccess(req, [Roles.Administrator]);
    for (const id of args.id) {
      try {
        const commission = await session.load<Commission>(id);
        if (!commission) {
          return null;
        }
        commission.status = 'Paid';
        await session.store(commission);
      } catch (ex) {
        await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
        await session.saveChanges();
        throw new Error('There was an error. Please try again. The Tech team has been notified.');
      }
    }
    await session.saveChanges();
    return true;
  }

  @Mutation(() => Boolean)
  async markCommissionAsPending(@Arg('args') args: MarkCommissionInput, @Ctx() { session, req }: Context): Promise<boolean> {
    verifyAccess(req, [Roles.Administrator]);
    for (const id of args.id) {
      try {
        const commission = await session.load<Commission>(id);
        if (!commission) {
          return null;
        }
        commission.status = 'Pending';
        commission.payCommissionOn = DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate(); // Friday Day Of Week
        await session.store(commission);
      } catch (ex) {
        await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
        await session.saveChanges();
        throw new Error('There was an error. Please try again. The Tech team has been notified.');
      }
    }
    await session.saveChanges();
    return true;
  }

  @Mutation(() => Boolean)
  async markCommissionAsRefunded(@Arg('args') args: MarkCommissionInput, @Ctx() { session, req }: Context): Promise<boolean> {
    verifyAccess(req, [Roles.Administrator]);
    for (const id of args.id) {
      try {
        const commission = await session.load<Commission>(id);
        if (!commission) {
          return null;
        }
        commission.status = 'Refunded';
        // inactive user
        const userId = commission.customer.id;
        const user = await session.load<User>(userId);
        user.active = false;
        await session.store(user);
        await session.store(commission);
      } catch (ex) {
        await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
        await session.saveChanges();
        throw new Error('There was an error. Please try again. The Tech team has been notified.');
      }
    }
    await session.saveChanges();
    return true;
  }
}
