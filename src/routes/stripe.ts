import { Router, Response } from 'express';
import { CustomRequest, createAndSendException } from '@/helpers/utils';
import { indexOf } from 'lodash';
import config from '@/helpers/config';
import * as stripe from '@/helpers/stripe';
// import { Order } from '../db/models/Order';
import { DumpBucket } from '@/types/dumpBucket';
import { Order } from '@/types/order';
import { PaymentAccountEnum } from '@/types/Enums';
// import { PaymentAccountEnum } from '../interfaces/product';

const routes = Router();

routes.get('/stripe/ping', (req: CustomRequest, res: Response) => {
  res.status(200).send('pong');
  res.end();
});

routes.post('/stripe/web/hook', async (req: CustomRequest, res: Response) => {
  const session = req.db.openSession();
  const sourceIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
  if (indexOf(config.StripeWebHookIPs, sourceIp) >= 0 || true) {
    const dump = new DumpBucket(null, null, req.body);
    await session.store(dump);
    await session.saveChanges();
    try {
      const hasEventHappenedBefore = await session
        .query<Order>({ collection: 'Orders' })
        .whereEquals('invoice.eventId', req.body.id)
        .orElse()
        .whereEquals('invoice.invoiceId', req.body.data.object.id)
        .any();

      if (!hasEventHappenedBefore) {
        switch (req.body.type) {
          case 'invoice.updated':
            // res.json(await processInvoiceUpdated(session, req.body.data.id, req.body.data.object));
            res.sendStatus(202);
            break;

          case 'invoice.payment_succeeded':
            res.json(await stripe.processInvoiceUpdated(session, req.body, PaymentAccountEnum.YepWonder7Global));
            break;

          case 'invoice.created':
            res.sendStatus(202);
            break;

          case 'invoice.upcoming':
            res.sendStatus(202);
            break;

          case 'customer.subscription.created':
            res.json(await stripe.processCustomerSubscriptionCreated(session, req.body, PaymentAccountEnum.TripValetIncentives));
            break;

          case 'customer.subscription.updated':
            res.json(await stripe.processCustomerSubscriptionUpdated(session, req.body, PaymentAccountEnum.TripValetIncentives));
            break;

          case 'plan.created':
            res.sendStatus(202);
            break;

          case 'plan.updated':
            res.sendStatus(202);
            break;

          case 'plan.deleted':
            res.sendStatus(202);
            break;

          case 'product.created':
            res.sendStatus(202);
            break;

          case 'product.updated':
            res.sendStatus(202);
            break;

          case 'product.deleted':
            res.sendStatus(202);
            break;

          default:
            res.sendStatus(202);
            break;
        }
      } else {
        res.sendStatus(202);
      }
    } catch (ex) {
      await session.store(await createAndSendException(req.body.data.object.id, new Error(ex.message).stack, ex.message, req.body));
      await session.saveChanges();
      res.sendStatus(400);
    }
  } else {
    const dump = new DumpBucket(null, null, {
      headers: req.headers,
      success: false,
      reason: 'IP not found in Stripe WebHook IP list',
      stripWebHookIPs: config.StripeWebHookIPs,
      body: req.body,
    });
    await session.store(dump);
    await session.saveChanges();
    res.sendStatus(400);
  }
});

routes.post('/stripe/web/hook/yep', async (req: CustomRequest, res: Response) => {
  return handleStripeWebHook(req, res, PaymentAccountEnum.YepWonder7Global);
});

routes.post('/stripe/web/hook/tv', async (req: CustomRequest, res: Response) => {
  return handleStripeWebHook(req, res, PaymentAccountEnum.TripValetLLC);
});

routes.post('/stripe/web/hook/tvi', async (req: CustomRequest, res: Response) => {
  return handleStripeWebHook(req, res, PaymentAccountEnum.TripValetIncentives);
});

routes.post('/stripe/web/hook/gm', async (req: CustomRequest, res: Response) => {
  return handleStripeWebHook(req, res, PaymentAccountEnum.GetMotivated);
});

routes.post('/stripe/web/hook/tvg', async (req: CustomRequest, res: Response) => {
  return handleStripeWebHook(req, res, PaymentAccountEnum.TripValetGeneral);
});

// tslint:disable-next-line: only-arrow-functions
async function handleStripeWebHook(req: CustomRequest, res: Response, paymentAccountKey: PaymentAccountEnum) {
  const session = req.db.openSession();
  const sourceIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for'];
  if (indexOf(config.StripeWebHookIPs, sourceIp) >= 0 || true) {
    const dump = new DumpBucket(null, req.body.type, req.body);
    await session.store(dump);
    await session.saveChanges();
    try {
      const hasEventHappenedBefore = await session
        .query<Order>({ collection: 'Orders' })
        .whereEquals('invoice.eventId', req.body.id)
        .orElse()
        .whereEquals('invoice.invoiceId', req.body.data.object.id)
        .any();

      if (!hasEventHappenedBefore) {
        const dumpBucket = new DumpBucket(null, `[TRACE]: ${req.body.type}`, {
          function: 'handleStripeWebHook > Line 121',
          paymentAccountKey,
          event: req.body,
        });
        await session.store(dumpBucket);
        await session.saveChanges();

        switch (req.body.type) {
          case 'invoice.updated':
            // res.json(await processInvoiceUpdated(session, req.body.data.id, req.body.data.object));
            res.sendStatus(202);
            break;

          case 'invoice.payment_succeeded':
            res.json(await stripe.processInvoiceUpdated(session, req.body, paymentAccountKey));
            break;

          case 'invoice.created':
            res.sendStatus(202);
            break;

          case 'invoice.upcoming':
            res.sendStatus(202);
            break;

          case 'customer.subscription.created':
            res.json(await stripe.processCustomerSubscriptionCreated(session, req.body, paymentAccountKey));
            break;

          case 'customer.subscription.updated':
            res.json(await stripe.processCustomerSubscriptionUpdated(session, req.body, paymentAccountKey));
            break;

          case 'plan.created':
            res.sendStatus(202);
            break;

          case 'plan.updated':
            res.sendStatus(202);
            break;

          case 'plan.deleted':
            res.sendStatus(202);
            break;

          case 'product.created':
            res.sendStatus(202);
            break;

          case 'product.updated':
            res.sendStatus(202);
            break;

          case 'product.deleted':
            res.sendStatus(202);
            break;

          default:
            res.sendStatus(202);
            break;
        }
      } else {
        res.sendStatus(202);
      }
    } catch (ex) {
      await session.store(await createAndSendException(req.body.data.object.id, new Error(ex.message).stack, ex.message, req.body));
      await session.saveChanges();
      res.sendStatus(400);
    }
  } else {
    const dump = new DumpBucket(null, null, {
      headers: req.headers,
      success: false,
      reason: 'IP not found in Stripe WebHook IP list',
      stripWebHookIPs: config.StripeWebHookIPs,
      body: req.body,
    });
    await session.store(dump);
    await session.saveChanges();
    res.sendStatus(400);
  }
}

routes.get('/stripe/invoice/:id', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getInvoice(req.params.id, <PaymentAccountEnum>req.query.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/product/:id', async (req: CustomRequest, res: Response) => {
  const key: PaymentAccountEnum = <PaymentAccountEnum>req.params.paymentAccountKey;
  const resp = await stripe.getProduct(req.params.id, key);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/plan/:id', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getPlan(req.params.id, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/charge/:id', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getCharge(req.params.id, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/event/:id', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getEvents(req.params.id, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/customer/:id', async (req: CustomRequest, res: Response) => {
  console.log('params', req.params, req.query);
  const resp = await stripe.getCustomer(req.params.id, <PaymentAccountEnum>req.query.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/plans', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getPlans(<PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/products', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getProducts(<PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/subscriptions', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getSubscriptions(<PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/customer/email/:email', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getCustomerByEmailAddress(req.params.email, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.post('/stripe/create/subscription', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.createSubscription(req.body.customer, req.body.plan, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.get('/stripe/customers/charges/:customer', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.getCharges(req.params.customer, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.post('/stripe/delete/card', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.deleteCard(req.body.customerId, req.body.cardId, <PaymentAccountEnum>req.params.paymentAccountKey);
  console.log(resp);
  res.json(resp);
});

routes.post('/stripe/subscription/update-subscription', async (req: CustomRequest, res: Response) => {
  const resp = await stripe.updateSubscription(req.body.subscriptionId, req.body.user, req.body.billingInfo, req.body.address, <PaymentAccountEnum>(
    req.params.paymentAccountKey
  ));
  console.log(resp);
  res.json(resp);
});

export default routes;
