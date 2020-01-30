import { IDocumentStore, AwaitableMaintenanceOperation } from 'ravendb';
import { User } from '@/types/user';
import { UserSubscription } from '@/types/userSubscription';

export default {
  name: '2018-11-11-MoveUserSubscriptionToUser',
  up: async (store: IDocumentStore) => {
    store.conventions.maxNumberOfRequestsPerSession = 100;
    const session = store.openSession();

    const users = await session
      .query<User>({ indexName: 'Users' })
      .whereEquals('active', true)
      .all();

    const userSubscriptions = await session.query<UserSubscription>({ collection: 'UserSubscriptions' }).all();

    // for (let user of users) {
    //   console.log(user.id);
    //   const us: IUserSubscription = find<IUserSubscription>(userSubscriptions, sub => {
    //     return sub.user.id === user.id;
    //   });
    //   if (us) {
    //     if (!user.stripe) {
    //       user.stripe = new StripeData('', us.subscriptionId, null, us.plan.id, us.customer.id);
    //     }
    //     user.stripe.subscription = new UserStripeSubscription(us.subscriptionId, us.status, us.isRevenueShare, us.start, us.currentPeriodStart, us.currentPeriodEnd, us.customer, us.plan, us.product);
    //   } else {
    //     if (user.stripe) {
    //       try {
    //         const stripeCustomer = await getCustomer(user.stripe.customerId);
    //         const stripePlan = await getPlan(user.stripe.planId);
    //         const stripeProduct = await getProduct(typeof stripePlan.product === 'string' ? stripePlan.product : stripePlan.toString());
    //         const stripeSubscription = await getSubscription(user.stripe.subscriptionId);
    //         user.stripe.subscription = new UserStripeSubscription(stripeSubscription.id, stripeSubscription.status, false, moment.unix(stripeSubscription.start).toDate(), moment.unix(stripeSubscription.current_period_start).toDate(), moment.unix(stripeSubscription.current_period_end).toDate(), new StripeCustomerReference(stripeCustomer.id, stripeCustomer.email), new StripePlanReference(stripePlan.id, stripePlan.nickname, stripePlan.interval, stripePlan.interval_count, stripePlan.amount, typeof stripePlan.product === 'string' ? stripePlan.product : stripePlan.toString()), new StripeProductReference(stripeProduct.id, stripeProduct.name));
    //       } catch (ex) {
    //         console.log(user.id, ex.message);
    //       }
    //     }
    //   }
    // }
    // // await session.saveChanges();
    // console.log('Starting Bulk Update');
    // const tryBulkUpdate = store.bulkInsert();
    // for (const user of users) {
    //   await tryBulkUpdate.store(user, user.id);
    // }
    // await tryBulkUpdate.finish();
    // console.log('Finished Bulk Update');
  },
  down: async () => {
    console.log('2019-11-01-AddOrderTotalToCommission > down');
  },
};
