import { IDocumentStore } from 'ravendb';
import { UserSubscription, UserStripeSubscription } from '@/types/userSubscription';

export default {
  name: '2018-11-11-RedoUserSubscription',
  up: async (store: IDocumentStore) => {
    store.conventions.maxNumberOfRequestsPerSession = 100;
    const session = store.openSession();

    const userSubscriptions = await session.query<UserSubscription>({ collection: 'UserSubscriptions' }).all();

    for (const us of userSubscriptions) {
      console.log(us.id);
      us.type = 'Stripe';
      us.stripe = new UserStripeSubscription(us.subscriptionId, us.stripe.customer, us.stripe.plan, us.stripe.product);

      // const us: IUserSubscription = find<IUserSubscription>(userSubscriptions, sub => {
      //   return sub.user.id === user.id;
      // });
      // if (us) {
      //   if (!user.stripe) {
      //     user.stripe = new StripeData('', us.subscriptionId, null, us.plan.id, us.customer.id);
      //   }
      //   user.stripe.subscription = new UserStripeSubscription(us.subscriptionId, us.status, us.isRevenueShare, us.start, us.currentPeriodStart, us.currentPeriodEnd, us.customer, us.plan, us.product);
      // } else {
      //   if (user.stripe) {
      //     try {
      //       const stripeCustomer = await getCustomer(user.stripe.customerId);
      //       const stripePlan = await getPlan(user.stripe.planId);
      //       const stripeProduct = await getProduct(typeof stripePlan.product === 'string' ? stripePlan.product : stripePlan.toString());
      //       const stripeSubscription = await getSubscription(user.stripe.subscriptionId);
      //       user.stripe.subscription = new UserStripeSubscription(stripeSubscription.id, stripeSubscription.status, false, moment.unix(stripeSubscription.start).toDate(), moment.unix(stripeSubscription.current_period_start).toDate(), moment.unix(stripeSubscription.current_period_end).toDate(), new StripeCustomerReference(stripeCustomer.id, stripeCustomer.email), new StripePlanReference(stripePlan.id, stripePlan.nickname, stripePlan.interval, stripePlan.interval_count, stripePlan.amount, typeof stripePlan.product === 'string' ? stripePlan.product : stripePlan.toString()), new StripeProductReference(stripeProduct.id, stripeProduct.name));
      //     } catch (ex) {
      //       console.log(user.id, ex.message);
      //     }
      //   }
      // }
    }
    // await session.saveChanges();
    console.log('Starting Bulk Update');
    const tryBulkUpdate = store.bulkInsert();
    for (const userSubscription of userSubscriptions) {
      await tryBulkUpdate.store(userSubscription, userSubscription.id);
    }
    await tryBulkUpdate.finish();
    console.log('Finished Bulk Update');
  },
  down: async () => {
    console.log('2018-11-11-RedoUserSubscription > down');
  },
};
