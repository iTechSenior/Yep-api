import Stripe, { customers } from 'stripe';
import { find, uniq, some } from 'lodash';
import { Exception } from '@/types/exception';
import {
  ISaleInfo,
  IStripeChargeCustomerResult,
  StripeCustomerReference,
  StripePlanReference,
  StripeProductReference,
  ICreateSubscriptionResult,
  ICreateCustomerResult,
  ICreateSourceResult,
  IRetrievePlanResult,
  IRetrieveCustomerResult,
  IGetPlansListResults,
  IRetrieveProductResult,
  IGetProductsListResult,
  ICreateTokenResult,
  ISetDefaultSourceResult,
  ICreateChargeResult,
  ICreateInvoiceItemResult,
  ICreatePaymentMethodResult,
} from './interfaces';
import { IDocumentSession, EntitiesCollectionObject } from 'ravendb';
import { Product, ProductReference, TierLevel } from '@/types/product';
import { User, UserReference, CreditCard, StripeData } from '@/types/user';
import { Address, AddressInput } from '@/types/address';
import { Ancestry } from '@/types/ancestry';
import { getAncestorLevelsUp } from './user';
import { Commission, CommissionRevenueShare } from '@/types/commission';
import { EscapeBuck } from '@/types/escapeBuck';
import moment = require('moment');
import { Order, OrderReference } from '@/types/order';
import { UserSubscription, UserStripeSubscription } from '@/types/userSubscription';
import { DateTime } from 'luxon';
import {
  getNowUtc,
  createAndSendException,
  getValidUsername,
  sendTripValetWelcome,
  sendTripValetIncentivesWelcome,
  Roles,
  getShortUuid,
} from '@/helpers/utils';
import { StripeWebhook, StripeChargeReference, StripeSourceReference, StripeSubscriptionReference, StripeCustomerInvoiceReference } from '@/types/stripe';
import { APIMessageResponse } from '@/types/common';
import { sorDeactivateMember, sorGetApiCredentials, sorActivateMember } from '@/helpers/sor';
import { DumpBucket } from '@/types/dumpBucket';
import { v4 } from 'uuid';
import { generate } from 'shortid';
import { PaymentAccountEnum } from '@/types/Enums';
import shortid = require('shortid');
import { RevenueShare } from '@/types/revenueShare';

const getPaymentAPIKey = (paymentKey: string) => {
  switch (paymentKey) {
    case 'PAYMENT_API_KEY_TripValetLLC':
      return process.env.PAYMENT_API_KEY_TripValetLLC;
    case 'PAYMENT_API_KEY_GetMotivated':
      return process.env.PAYMENT_API_KEY_GetMotivated;
    case 'PAYMENT_API_KEY_TripValetGeneral':
      return process.env.PAYMENT_API_KEY_TripValetGeneral;
    case 'PAYMENT_API_KEY_CiceroTravel':
      return process.env.PAYMENT_API_KEY_CiceroTravel;
    case 'PAYMENT_API_KEY_TripValetIncentives':
      return process.env.PAYMENT_API_KEY_TripValetIncentives;
    case 'PAYMENT_API_KEY_YEP':
      return process.env.PAYMENT_API_KEY_YEP;
  }
};

const getChargePrefix = (paymentKey: string) => {
  switch (paymentKey) {
    case 'PAYMENT_API_KEY_TripValetLLC':
      return 'TripValet';
    case 'PAYMENT_API_KEY_GetMotivated':
      return 'Get Motivated';
    case 'PAYMENT_API_KEY_TripValetGeneral':
      return 'TripValet';
    case 'PAYMENT_API_KEY_CiceroTravel':
      return 'Cicero';
    case 'PAYMENT_API_KEY_TripValetIncentives':
      return 'TVI';
    case 'PAYMENT_API_KEY_YEP':
      return 'YEP';
  }
};

export const attachPaymentMethod = (paymentMethodId: string, customerId: string, paymentKey: string): Promise<Stripe.paymentMethods.IPaymentMethod> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
};

export const createInvoiceItem = async (
  amount: number,
  customerId: string,
  description: string,
  paymentAccountKey: string
): Promise<ICreateInvoiceItemResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentAccountKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    return {
      success: true,
      payload: await stripe.invoiceItems.create({
        amount,
        currency: 'usd',
        customer: customerId,
        description,
      }),
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create InvoiceItem',
          function: 'stripe.ts > createInvoiceItem > stripe.invoiceItems.create',
        },
        success: false,
        error: ex.message,
        function: 'createInvoiceItem()',
        paymentAccountKey,
      }),
    };
  }
};

export const createPaymentMethod = async (card: CreditCard, paymentAccountKey: string): Promise<ICreatePaymentMethodResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentAccountKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');

  try {
    return {
      success: true,
      payload: await stripe.paymentMethods.create({
        type: 'card',
        card: {
          number: card.number,
          exp_month: Number.parseInt(card.month),
          exp_year: Number.parseInt(card.year),
          cvc: card.cvc,
        },
      }),
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Payment Method',
          function: 'stripe.ts > createPaymentMethod > stripe.paymentMethods.create',
        },
        success: false,
        error: ex.message,
        function: 'createPaymentMethod()',
        paymentAccountKey,
      }),
    };
  }
};

export const getPaymentIntent = (intentId: string, paymentKey: string): Promise<Stripe.paymentIntents.IPaymentIntent> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.paymentIntents.retrieve(intentId);
};

export const payInvoice = (invoiceId: string, paymentKey: string): Promise<Stripe.invoices.IInvoice> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.invoices.pay(invoiceId, { expand: ['payment_intent'] });
};

export const createTestPlan = async (paymentKey: string): Promise<IRetrievePlanResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');

  return {
    success: true,
    payload: await stripe.plans.create({
      amount: 5000,
      interval: 'year',
      product: {
        name: 'test product',
      },
      currency: 'usd',
    }),
  };
};

export const getInvoice = (invoiceId: string, paymentKey: string): Promise<Stripe.invoices.IInvoice> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.invoices.retrieve(invoiceId);
};

export const getEvents = async (eventId: string, paymentKey: string): Promise<Stripe.events.IEvent> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.events.retrieve(eventId);
};

export const getCharge = async (chargeId: string, paymentKey: string): Promise<Stripe.charges.ICharge> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.charges.retrieve(chargeId);
};

export const getSubscription = async (subscriptionId: string, paymentKey: string): Promise<Stripe.subscriptions.ISubscription> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.subscriptions.retrieve(subscriptionId);
};

export const getSubscriptionByPlan = async (customerId: string, planId: string, paymentKey: string): Promise<Stripe.subscriptions.ISubscription> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');

  const getCustomerResult = await getCustomer(customerId, paymentKey);
  if (!getCustomerResult.success) {
    return null;
  }
  for (const subscription of getCustomerResult.payload.subscriptions.data) {
    if (subscription.plan.id === planId && subscription.status === 'active') {
      return subscription;
    }
  }
  return null;
};

export const createSubscription = async (
  customerId: string,
  plan: Stripe.plans.IPlan,
  paymentAccountKey: PaymentAccountEnum,
  referralCode: string = null,
  couponCode: string = null,
  additionalMetadata: { [key: string]: string | number } = null
): Promise<ICreateSubscriptionResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentAccountKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    stripe.setApiVersion('2019-10-08');
    const customer = await getCustomer(customerId, paymentAccountKey);
    if (customer.success) {
      if (customer.payload.subscriptions.total_count > 0) {
        const existingSubscription = find(customer.payload.subscriptions.data, (sub: Stripe.subscriptions.ISubscription) => {
          return sub.plan.id === plan.id;
        });
        if (existingSubscription) {
          return { success: true, payload: existingSubscription };
        }
      }
    }

    const payload: Stripe.subscriptions.ISubscriptionCreationOptions = {
      customer: customerId,
      trial_period_days: plan.trial_period_days || 0,
      items: [
        {
          plan: plan.id,
        },
      ],
      metadata: { paymentAccountKey },
      expand: ['latest_invoice.payment_intent'],
    };

    if (referralCode) {
      payload.metadata = { ...payload.metadata, referralCode };
    }

    if (couponCode) {
      payload.metadata = { ...payload.metadata, couponCode };
      payload.coupon = couponCode;
    }

    if (additionalMetadata) {
      payload.metadata = { ...payload.metadata, ...additionalMetadata };
    }

    return {
      success: true,
      payload: await stripe.subscriptions.create(payload),
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Stripe Subscription',
          function: 'stripe.ts > createSubscription > stripe.subscriptions.create',
        },
        success: false,
        error: ex.message,
        function: 'createSubscription()',
        paymentAccountKey,
      }),
    };
  }
};

export const createUserAndSubscription = async (
  user: User,
  product: Product,
  saleInfo: CreditCard,
  token: string,
  paymentKey: PaymentAccountEnum
): Promise<APIMessageResponse> => {
  try {
    const customer = await createCustomer(user.email, user.firstName, user.lastName, user.phone, product.amount, token, paymentKey);
    if (!customer) return { success: false, message: 'No User Found/Created' };
    const plan = await getPlan(product.plan.id, paymentKey);
    let subscription: ICreateSubscriptionResult;
    // let card: Stripe.cards.ICard;
    // if (customer.sources.data.length === 0) {
    //   card = await createCardSource(customer, saleInfo, paymentKey);
    // }

    subscription = await createSubscription(customer.payload.id, plan.payload, paymentKey);
    if (!subscription) return { success: false, message: 'No Subscription Created' };

    subscription = await updateSubscription(subscription.payload.id, user, saleInfo, user.address, paymentKey);
    if (subscription) return { success: true, message: 'Subscription Created' };
    else return { success: false, message: 'Failed to Create Subscription' };
  } catch (e) {
    console.error(e);
    return { success: false, message: e };
  }
};
export const getCharges = async (customer: string, paymentKey: string): Promise<Stripe.charges.ICharge> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const res = await stripe.charges.list({
    customer,
  });
  return res.data[0];
};

export const createSubscriptionItem = (subscriptionId: string, paymentKey: string): Promise<Stripe.subscriptions.ISubscription> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.subscriptions.retrieve(subscriptionId);
};

export const getSubscriptions = (paymentKey: string): Promise<Stripe.IList<Stripe.subscriptions.ISubscription>> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.subscriptions.list();
};

export const cancelSubscription = (subscriptionId: string, paymentKey: string): Promise<Stripe.subscriptions.ISubscription> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    return stripe.subscriptions.del(subscriptionId);
  } catch (ex) {
    return null;
  }
};

export const getCustomers = async (paymentKey: string, limit: number = 100): Promise<Stripe.customers.ICustomer[]> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');

  const customers: Stripe.IList<Stripe.customers.ICustomer> = await stripe.customers.list({ limit });
  let response: Stripe.customers.ICustomer[] = [];
  response = customers.data;

  if (customers.has_more) {
    response = response.concat(await paginateCustomers(paymentKey, customers.data[customers.data.length - 1].id, limit, response));
  }
  return response;
};

export const paginateCustomers = async (
  paymentKey: string,
  startingAt: string,
  limit: number,
  response: Stripe.customers.ICustomer[]
): Promise<Stripe.customers.ICustomer[]> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const customers: Stripe.IList<Stripe.customers.ICustomer> = await stripe.customers.list({ limit, starting_after: startingAt });

  if (customers.has_more) {
    return response.concat(await paginateCustomers(paymentKey, customers.data[customers.data.length - 1].id, limit, response));
  }
  return customers.data;
};

export const getCustomer = async (customerId: string, paymentKey: string): Promise<IRetrieveCustomerResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    const customer = await stripe.customers.retrieve(customerId);
    return { success: true, payload: customer };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Retrieve Stripe Customer',
          function: 'stripe.ts > getCustomer > stripe.customers.retrieve',
        },
        success: false,
        error: ex.message,
        customerId,
        paymentKey,
      }),
    };
  }
};

export const createCharge = async (
  customer: Stripe.customers.ICustomer,
  saleInfo: ISaleInfo,
  cardId: string,
  description: string,
  paymentKey: string
): Promise<ICreateChargeResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    const charge = await stripe.charges.create({
      amount: saleInfo.chargeAmount,
      currency: 'usd',
      source: cardId,
      customer: customer.id,
      receipt_email: customer.email,
      description: `${getChargePrefix(paymentKey)}: ${description}`,
    });
    return {
      success: true,
      payload: charge,
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Stripe Charge',
          function: 'stripe.ts > createCharge > stripe.charges.create',
        },
        success: false,
        error: ex.message,
        customer,
        saleInfo,
        token: cardId,
        paymentKey,
      }),
    };
  }
};
export const getCustomerByEmailAddress = async (email: string, paymentKey: string): Promise<Stripe.customers.ICustomer> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const customer = await stripe.customers.list({ email });
  return customer.total_count > 0 ? customer.data[0] : null;
};
export const getPlan = async (planId: string, paymentKey: string): Promise<IRetrievePlanResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    return { success: true, payload: await stripe.plans.retrieve(planId) };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Retrieve Stripe Plan',
          function: 'stripe.ts > getPlan > stripe.plans.retrieve',
        },
        success: false,
        error: ex.message,
        planId,
        paymentKey,
      }),
    };
  }
};
export const getPlans = async (paymentKey: string): Promise<IGetPlansListResults> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return {
    success: true,
    payload: await stripe.plans.list({ limit: 100 }),
  };
};
export const getProduct = async (productId: string, paymentKey: string): Promise<IRetrieveProductResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return {
    success: true,
    payload: await stripe.products.retrieve(productId),
  };
};
export const getProducts = async (paymentKey: string): Promise<IGetProductsListResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return {
    success: true,
    payload: await stripe.products.list(),
  };
};
export const getCustomerByEmail = async (email: string, paymentKey: string): Promise<Stripe.customers.ICustomer[]> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const list = await stripe.customers.list({ email }); // the @types/stripe if not correct here > { email });
  return list.data;
};
export const getToken = async (tokenId: string, paymentKey: string): Promise<Stripe.tokens.IToken> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const token = await stripe.tokens.retrieve(tokenId);
  return token;
};
export const createToken = async (billingInfo: CreditCard, address: AddressInput, user: User, paymentKey: string): Promise<ICreateTokenResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    const token = await stripe.tokens.create({
      card: {
        object: 'card',
        number: billingInfo.number,
        exp_month: +billingInfo.month,
        exp_year: +billingInfo.year,
        cvc: billingInfo.cvc,
        name: `${user.firstName} ${user.lastName}`,
        address_city: address.city,
        address_line1: address.address,
        address_line2: '',
        address_state: address.state,
        address_zip: address.zip,
      },
    });
    return {
      success: true,
      payload: token,
    };
  } catch (ex) {
    const billingInfoMasked = billingInfo;
    const regex = /\d(?=\d{4})/gm;
    billingInfoMasked.number = billingInfoMasked.number.replace(regex, '*');

    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Stripe Token',
          function: 'stripe.ts > createToken > stripe.tokens.create',
        },
        success: false,
        error: ex.message,
        billingInfoMasked,
        address,
        user,
        paymentKey,
      }),
    };
  }
};

export const deleteCard = async (customerId: string, cardId: string, paymentKey: string): Promise<Stripe.IDeleteConfirmation> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.customers.deleteCard(customerId, cardId);
};
export const updateSubscription = async (
  subscriptionId: string,
  user: User,
  billingInfo: CreditCard,
  address: Address,
  paymentKey: string
): Promise<ICreateSubscriptionResult> => {
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    return {
      success: true,
      payload: await stripe.subscriptions.update(subscriptionId, {
        source: {
          object: 'card',
          exp_month: +billingInfo.month,
          exp_year: +billingInfo.year,
          number: billingInfo.number,
          cvc: billingInfo.cvc,
          name: `${user.firstName} ${user.lastName}`,
          address_city: address.city,
          address_line1: address.address,
          address_line2: '',
          address_state: address.state,
          address_zip: address.zip,
        },
      }),
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Update Stripe Subscription',
          function: 'stripe.ts > updateSubscription > stripe.subscriptions.update',
        },
        success: false,
        error: ex.message,
        subscriptionId,
        user,
        billingInfo,
        address,
        paymentKey,
      }),
    };
  }
};
export const createCardSource = async (
  customer: Stripe.customers.ICustomer,
  saleInfo: ISaleInfo,
  address: Address,
  paymentKey: string
): Promise<ICreateSourceResult> => {
  let source: any;
  try {
    const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
    source = {
      object: 'card',
      exp_month: +saleInfo.ccExpMonth,
      exp_year: +saleInfo.ccExpYear,
      number: saleInfo.card,
      cvc: saleInfo.cvc,
      name: `${saleInfo.firstNameOnCard} ${saleInfo.lastNameOnCard}`,
      // currency: 'usd', // NOTE: MISSING in Stripe Type D.TS
    };

    if (address) {
      source['address_city'] = address.city;
      source['address_line1'] = address.address;
      source['address_line2'] = '';
      source['address_state'] = address.state;
      source['address_zip'] = address.zip;
    }

    return {
      success: true,
      payload: await stripe.customers.createSource(customer.id, {
        source,
      }),
    };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Stripe Customer Source (Card)',
          function: 'stripe.ts > createCardSource > stripe.customers.createSource',
        },
        success: false,
        error: ex.message,
        source,
        customer,
        saleInfo,
        address,
        paymentKey,
      }),
    };
  }
};

export const setDefaultSource = async (customer: Stripe.customers.ICustomer, cardId: string, paymentKey: string): Promise<ISetDefaultSourceResult> => {
  return null;
  // try {
  //   const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  //   let card: Stripe.cards.ICard = find(customer.sources.data, {
  //     id: cardId,
  //   });

  //   const result = await stripe.customers.update(customer.id, {
  //     default_source: card.id,
  //   });

  //   return {
  //     success: true,
  //     payload: result,
  //   };
  // } catch (ex) {
  //   return {
  //     success: false,
  //     exception: new Exception(null, null, new Error().stack, ex.message, {
  //       location: {
  //         message: 'Failed to Update Stripe Customer Default Source (Card)',
  //         function: 'stripe.ts > setDefaultSource > stripe.customers.update',
  //       },
  //       success: false,
  //       error: ex.message,
  //       customer,
  //       cardId,
  //       paymentKey,
  //     }),
  //   };
  // }
};

export const createCustomer = async (
  email: string,
  firstName: string,
  lastName: string,
  phone: string,
  amount: number,
  token: string,
  paymentKey: string,
  additionalMetadata: { [key: string]: string | number } = {},
  paymentMethodId: string = null
): Promise<ICreateCustomerResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  let customer: Stripe.customers.ICustomer;
  const customerList = await stripe.customers.list({ email: email });
  if (customerList.data && customerList.data.length > 0) {
    customer = customerList.data[0];
    for (const cus of customerList.data) {
      try {
        await stripe.customers.del(cus.id);
      } catch (ex) {
        console.log(ex);
      }
    }
    // try {
    //   await stripe.customers.update(customer.id, {
    //     source: token,
    //   });
    // } catch (ex) {
    //   return {
    //     success: true,
    //     payload: customer,
    //     exception: new Exception(null, null, new Error(ex.message).stack, ex.message, {
    //       location: {
    //         message: 'Failed to Create Stripe Customer',
    //         function: 'stripe.ts > createCustomer > stripe.customers.update',
    //       },
    //       success: false,
    //       error: ex.message,
    //       email,
    //       firstName,
    //       lastName,
    //       token,
    //       paymentKey,
    //     }),
    //   };
    // }

    // return { success: true, payload: customer };
  }
  try {
    customer = await stripe.customers.create({
      email: email,
      description: `${firstName} ${lastName}`,
      source: token,
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
      payment_method: paymentMethodId,
      metadata: {
        firstName,
        lastName,
        phone,
        amount: amount.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }),
        ...additionalMetadata,
      },
    });
    return { success: true, payload: customer };
  } catch (ex) {
    return {
      success: false,
      exception: new Exception(null, null, new Error().stack, ex.message, {
        location: {
          message: 'Failed to Create Stripe Customer',
          function: 'stripe.ts > createCustomer > stripe.customers.create',
        },
        success: false,
        error: ex.message,
        email,
        firstName,
        lastName,
        paymentKey,
      }),
    };
  }
};
export const chargeCustomer = async (saleInfo: ISaleInfo, address: Address, paymentKey: string): Promise<IStripeChargeCustomerResult> => {
  return null;
  // try {
  //   const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  //   let customer: Stripe.customers.ICustomer;
  //   let cardSourceId: string = '';
  //   // first lookup customer and create if not existing by email
  //   const customerList = await stripe.customers.list({ email: saleInfo.email });
  //   if (customerList.data && customerList.data.length > 0) {
  //     customer = customerList.data[0];
  //   } else {
  //     try {
  //       // Create customer
  //       const { email, firstNameOnCard, lastNameOnCard } = saleInfo;
  //       customer = await stripe.customers.create({
  //         email: email,
  //         description: `Escape Trip Customer: ${firstNameOnCard} ${lastNameOnCard}`,
  //       });
  //     } catch (ex) {
  //       return {
  //         success: false,
  //         exception: new Exception(null, null, new Error().stack, ex.message, {
  //           location: {
  //             message: 'Failed to Create Stripe Customer',
  //             function: 'stripe.ts > chargeCustomer > stripe.customers.create',
  //           },
  //           success: false,
  //           saleInfo,
  //           paymentKey,
  //         }),
  //       };
  //     }
  //   }
  //   // console.log('customer', customer);
  //   // if customer found, check to see if they have a CC source that matches the card number's last 4 and exp_year and exp_year
  //   try {
  //     if (customer.sources && customer.sources.data && customer.sources.data.length > 0) {
  //       let { data } = customer.sources;
  //       // console.log('sources', data, {
  //       //   last4: saleInfo.card.slice(-4),
  //       //   exp_month: +saleInfo.ccExpMonth,
  //       //   exp_year: +saleInfo.ccExpYear,
  //       // });
  //       let card: Stripe.cards.ICard = find(data, {
  //         last4: saleInfo.card.slice(-4),
  //         exp_month: +saleInfo.ccExpMonth,
  //         exp_year: +saleInfo.ccExpYear,
  //       });
  //       if (card) {
  //         cardSourceId = card.id;
  //       } else {
  //         cardSourceId = (await createCardSource(customer, saleInfo, address, paymentKey)).payload.id;
  //       }
  //     } else {
  //       cardSourceId = (await createCardSource(customer, saleInfo, address, paymentKey)).payload.id;
  //     }
  //   } catch (ex) {
  //     // console.log('ex', ex);
  //     return {
  //       success: false,
  //       exception: new Exception(null, null, new Error().stack, ex.message, {
  //         success: false,
  //         error: ex.message,
  //         function: 'chargeCustomer()',
  //         paymentKey,
  //       }),
  //     };
  //   }
  //   try {
  //     const charge = await stripe.charges.create({
  //       amount: saleInfo.chargeAmount,
  //       currency: 'usd',
  //       source: cardSourceId,
  //       customer: customer.id,
  //       description: `TripValet # ${saleInfo.uuid}`,
  //     });
  //     return {
  //       success: true,
  //       payload: {
  //         success: charge.paid ? true : false,
  //         customerId: customer.id,
  //         sourceId: cardSourceId,
  //         chargeInfo: charge,
  //       },
  //     };
  //   } catch (ex) {
  //     return {
  //       success: false,
  //       exception: new Exception(null, null, new Error().stack, ex.message, {
  //         success: false,
  //         error: ex.message,
  //         function: 'chargeCustomer()',
  //         paymentKey,
  //       }),
  //     };
  //   }
  // } catch (ex) {
  //   return {
  //     success: false,
  //     exception: new Exception(null, null, new Error().stack, ex.message, {
  //       success: false,
  //       error: ex.message,
  //       function: 'chargeCustomer()',
  //       paymentKey,
  //     }),
  //   };
  // }
};

export const processInvoiceUpdated = async (session: IDocumentSession, event: Stripe.events.IEvent, paymentKey: string): Promise<Order> => {
  const invoice = <Stripe.invoices.IInvoice>event.data.object;
  try {
    if (invoice.paid && invoice.amount_paid > 0 && invoice.amount_remaining === 0) {
      const stripeProducts: Stripe.products.IProduct[] = [];
      for (const product of invoice.lines.data) {
        stripeProducts.push((await getProduct(product.plan.product.toString(), paymentKey)).payload);
      }
      // const stripeProduct = await getProduct(invoice.lines.data[0].plan.product, paymentKey);

      try {
        const product: Product = await session
          .query<Product>({ collection: 'Products' })
          .whereEquals('product.id', stripeProducts[0].id)
          .firstOrNull();
        paymentKey = product ? product.paymentAccount : PaymentAccountEnum.YepWonder7Global;
      } catch (ex) {
        await session.store(
          await createAndSendException(invoice.id, new Error(ex.message).stack, ex.message, {
            function: 'processInvoiceUpdated()',
            event,
            stripeProducts,
          })
        );
        await session.saveChanges();
      }

      const customerId = typeof invoice.customer === 'string' ? invoice.customer : (<Stripe.customers.ICustomer>invoice.customer).id;
      const stripeCustomer = await getCustomer(customerId, paymentKey);
      const stripeSubscription = await getSubscription(invoice.subscription.toString(), paymentKey);
      const stripeCharge = await getCharge(invoice.charge.toString(), paymentKey);

      const products: Product[] = await session
        .query<Product>({ collection: 'Products' })
        .whereIn(
          'name',
          stripeProducts.map(p => p.name)
        )
        .all();

      const customer: User = await session
        .query<User>({ collection: 'Users' })
        .whereEquals('email', stripeCustomer.payload.email)
        .firstOrNull();

      if (customer) {
        // const affiliate = await session.load<User>(customer.sponsor.id);

        customer.uuid = stripeSubscription.metadata['yepUuid'];

        // Add Product Roles to user for which they bought.
        products.forEach(product => {
          if (product.roles && product.roles.length) {
            customer.roles = uniq(customer.roles.concat(product.roles));
          }
        });

        // We need to add to the SOR Account if they have a TV Role and sendWelcome Email
        let order: Order = null;

        const exists: boolean = await session
          .query<Order>({ collection: 'Orders' })
          .whereEquals('invoice.invoiceId', invoice.id)
          .any();

        if (!exists) {
          const customerReference = new UserReference(customer.id, customer.email, customer.firstName, customer.lastName);
          // const affiliateReference = new UserReference(affiliate.id, affiliate.email, affiliate.firstName, affiliate.lastName);
          const chargeReference = new StripeChargeReference(
            stripeCharge.id,
            stripeCharge.amount,
            moment.unix(stripeCharge.created).toDate(),
            new StripeCustomerReference(stripeCustomer.payload.id, stripeCustomer.payload.email),
            stripeCharge.description,
            stripeCharge.paid,
            new StripeSourceReference(
              stripeCharge.source.id,
              (<Stripe.cards.ICard>stripeCharge.source).brand,
              (<Stripe.cards.ICard>stripeCharge.source).country,
              (<Stripe.cards.ICard>stripeCharge.source).last4,
              (<Stripe.cards.ICard>stripeCharge.source).exp_month,
              (<Stripe.cards.ICard>stripeCharge.source).exp_year
            ),
            stripeCharge.status
          );
          const userSubscription = await session.load<UserSubscription>(`${customer.id}/subscriptions/${stripeSubscription.id}`);
          const subscriptionReference = new StripeSubscriptionReference(
            stripeSubscription.id,
            moment.unix(stripeSubscription.current_period_start).toDate(),
            moment.unix(stripeSubscription.current_period_end).toDate(),
            new StripePlanReference(
              stripeSubscription.plan.id,
              stripeSubscription.plan.nickname,
              stripeSubscription.plan.interval,
              stripeSubscription.plan.interval_count,
              stripeSubscription.plan.amount,
              stripeSubscription.plan.product.toString()
            ),
            userSubscription ? userSubscription.id : null
          );
          const customerInvoiceReference = new StripeCustomerInvoiceReference(
            event.id,
            stripeCustomer.payload.id,
            typeof invoice.charge === 'string' ? invoice.charge : invoice.charge.id,
            invoice.id,
            subscriptionReference
          );
          const productReferences = products.map(p => {
            return new ProductReference(p.id, p.name, p.displayName, p.amount, p.plan.interval, p.setup);
          });
          const totalOrderAmount = products.map(p => p.amount).reduce((accumulator, currentValue) => accumulator + currentValue);

          order = new Order(
            null,
            null,
            productReferences,
            totalOrderAmount,
            customerReference,
            null,
            products[0].domain,
            chargeReference,
            customerInvoiceReference,
            [],
            stripeSubscription.metadata['requestedOnboardingCall'] === 'true'
          );

          await session.store(order);
          const orderReference = new OrderReference(order.id, order.products, order.totalAmount);

          if (customer.roles.some(role => role === Roles.TVIPro)) {
            try {
              const escapeBucks = new EscapeBuck(customerReference, orderReference, order.totalAmount * 0.05);

              await session.store(escapeBucks);
              await session.saveChanges();
            } catch (ex) {
              const dumpBucket = new DumpBucket(null, 'EscapeBucks Exception', {
                function: 'processInvoiceUpdated Trying to add EscapeBuck',
                exception: ex.message,
              });
              await session.store(dumpBucket);
              await session.saveChanges();
            }
          }
          // Store Webhook with the Order
          const webHook = new StripeWebhook(invoice.id, event.type, event, orderReference, customerReference, null);
          await session.store(webHook);
          await session.saveChanges();

          // const ancestors: string[] = getAncestorLevelsUp(customer.ancestry.ancestors);
          // const ancestorUsers: EntitiesCollectionObject<User> = await session.load<User>(ancestors);
          // let levelUp = 1;
          // let isAncestryBroken: boolean = false;
          // const isInsuranceCommission: boolean = false;
          // for (const ancestor of ancestors) {
          //   if (levelUp === 3 || (isAncestryBroken && levelUp === 2)) {
          //     break;
          //   }

          //   const ancestorUser: User = ancestorUsers[ancestor];
          //   if (ancestorUser.active) {
          //     // Check depth to not pay Laura at the top since Tom gets 10% across the board
          //     for (const product of products) {
          //       const productAmount = product.amount;
          //       let commissionAffiliateUser: UserReference;
          //       if (product.displayName === 'Membership Freeze') continue;

          //       const productTier: TierLevel = find<TierLevel>(product.tierPayouts, { level: levelUp });
          //       if (productTier) {
          //         commissionAffiliateUser = new UserReference(ancestorUser.id, ancestorUser.email, ancestorUser.firstName, ancestorUser.lastName);
          //         const commission = new Commission(
          //           DateTime.fromJSDate(getNextDayOfWeek(moment.unix(event.created).toDate(), 5)).toJSDate(), // Friday Day Of Week
          //           Number((productAmount * (productTier.value / 100)).toFixed(2)),
          //           'Pending',
          //           customerReference,
          //           commissionAffiliateUser,
          //           customerInvoiceReference,
          //           orderReference,
          //           productTier,
          //           new CommissionRevenueShare(false, null)
          //         );
          //         commission.createdAt = DateTime.fromMillis(invoice.date * 1000).toJSDate(); // Friday Day Of Week
          //         commission.updatedAt = moment().toDate();
          //         await session.store(commission);
          //       }

          //       // NOTE: Removed this as Laura does not get compression since Tom gets 10%
          //       // if (ancestorUser.ancestry.depth === 1 && levelUp === 1) {
          //       //   productTier = find<ITierLevel>(product.tierPayouts, { level: 2 });
          //       //   if (productTier) {
          //       //     const commission = new Commission(
          //       //       DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5)).toJSDate(), // Friday Day Of Week
          //       //       Number((product.amount * (productTier.value / 100)).toFixed(2)),
          //       //       'Pending',
          //       //       customerReference,
          //       //       commissionAffiliateUser,
          //       //       customerInvoiceReference,
          //       //       new OrderReference(order.id, order.products, order.totalAmount),
          //       //       productTier,
          //       //       new CommissionRevenueShare(false, null)
          //       //     );
          //       //     commission.createdAt = DateTime.fromMillis(invoice.date * 1000).toJSDate(); // Friday Day Of Week
          //       //     commission.updatedAt = moment().toDate();
          //       //     await session.store(commission);
          //       //   }
          //       // }
          //     }
          //     levelUp++;
          //   } else {
          //     // Now that ancestry is broken, we need to check to make sure we don't pay
          //     // pay out the second tier if we paid out the first tier.
          //     isAncestryBroken = true;
          //     if (ancestorUser.ancestry.depth === 1) levelUp = 3;
          //   }
          // }

          // if (order.isRevenueShare) {
          //   const revenueShares = await session
          //     .query<RevenueShare>({ collection: 'RevenueShares' })
          //     .whereEquals('userRole', 'CoinMD Member')
          //     .all();

          //   for (const share of revenueShares) {
          //     for (const product of products) {
          //       const commissionAmount = Number((product.amount * (share.commissionAmount / 100)).toFixed(2));
          //       const revenueCommission = new Commission(
          //         DateTime.fromJSDate(getNextDayOfWeek(moment.unix(event.created).toDate(), 5)).toJSDate(), // Friday Day Of Week
          //         commissionAmount,
          //         'Pending',
          //         customerReference,
          //         share.user,
          //         customerInvoiceReference,
          //         orderReference,
          //         null,
          //         new CommissionRevenueShare(true, share.id)
          //       );
          //       revenueCommission.createdAt = DateTime.fromMillis(invoice.date * 1000).toJSDate(); // Friday Day Of Week
          //       revenueCommission.updatedAt = moment().toDate();
          //       await session.store(revenueCommission);
          //     }
          //   }
          // }
        }
        await session.saveChanges();

        return order;
      }
      return null;
    }
    return null;
  } catch (ex) {
    await session.store(await createAndSendException(invoice.id, new Error(ex.message).stack, ex.message, { function: 'processInvoiceUpdated()', event }));
    await session.saveChanges();
    return null;
  }
};

export const getNextDayOfWeek = (date: Date, dayOfWeek: number, daysToAdd = 7) => {
  const resultDate = moment(date)
    .startOf('day')
    .add(daysToAdd, 'd')
    .toDate();
  resultDate.setDate(resultDate.getDate() + ((daysToAdd + dayOfWeek - date.getDay()) % 7));
  return resultDate;
};

export const getPreviousDayOfWeek = (date: Date, dayOfWeek: number, daysToAdd = 7) => {
  const resultDate = moment(date)
    .startOf('day')
    .subtract(daysToAdd, 'd')
    .toDate();
  console.log(resultDate);
  resultDate.setDate(resultDate.getDate() + ((daysToAdd + dayOfWeek - date.getDay()) % 7));
  return resultDate;
};

export const processInvoiceCreated = async (session: IDocumentSession, invoice: Stripe.invoices.IInvoice): Promise<any> => {
  try {
    // Do something?
  } catch (ex) {
    await session.store(await createAndSendException(invoice.id, new Error(ex.message).stack, ex.message, { function: 'processInvoiceCreated()', invoice }));
    await session.saveChanges();
    return null;
  }
};

export const processCustomerCreated = async (session: IDocumentSession, invoice: Stripe.customers.ICustomer): Promise<any> => {
  try {
    // We should create the customer at this point once the zap if not used?
  } catch (ex) {
    await session.store(await createAndSendException(invoice.id, new Error(ex.message).stack, ex.message, { function: 'processCustomeCreated()', invoice }));
    await session.saveChanges();
    return null;
  }
};

export const processCustomerSubscriptionCreated = async (
  session: IDocumentSession,
  event: Stripe.events.IEvent,
  paymentAccountKey: PaymentAccountEnum
): Promise<any> => {
  try {
    const subscription: Stripe.subscriptions.ISubscription = <Stripe.subscriptions.ISubscription>event.data.object;

    const dumpBucket = new DumpBucket(null, `[TRACE]: ${event.type}`, {
      function: 'processCustomerSubscriptionCreated > Line 1050',
      paymentAccountKey,
      subscriptionPlanProduct: subscription.plan.product,
      subscription,
      event,
    });
    await session.store(dumpBucket);
    await session.saveChanges();

    try {
      // paymentAccountKey = product ? product.paymentAccount : PaymentAccountEnum.TripValetLLC;
    } catch (ex) {
      await session.store(
        await createAndSendException(event.id, new Error(ex.message).stack, ex.message, {
          function: 'processCustomerSubscriptionCreated()',
          event,
          subscription,
        })
      );
      await session.saveChanges();
    }

    const stripeProduct: IRetrieveProductResult = await getProduct(<string>subscription.plan.product, paymentAccountKey);
    const stripeCustomer: IRetrieveCustomerResult = await getCustomer(<string>subscription.customer, paymentAccountKey);
    const stripePlan = await getPlan(subscription.plan.id, paymentAccountKey);
    try {
      let user: User = await session
        .query<User>({ collection: 'Users' })
        .whereEquals('email', stripeCustomer.payload.email)
        .firstOrNull();

      if (!user) {
        const product: Product = await session
          .query<Product>({ indexName: 'Products' })
          .whereEquals('productId', stripeProduct.payload.id)
          .firstOrNull();

        const source: Stripe.cards.ICard =
          stripeCustomer.payload.sources.total_count >= 1 ? (stripeCustomer.payload.sources.data[0] as Stripe.cards.ICard) : null;

        // "address_city": "Cumming",
        // "address_country": "United States of America",
        // "address_line1": "4365 Ambassador Way",
        // "address_line1_check": "pass",
        // "address_line2": null,
        // "address_state": "GA",
        // "address_zip": "30040",
        // "address_zip_check": "pass",
        // "brand": "Visa",
        // "country": "US",

        const address = source
          ? new Address(source.address_line1, source.address_city, source.address_state, source.address_zip, source.address_country)
          : new Address('', '', '', '', '');

        user = new User(
          getShortUuid(),
          stripeCustomer.payload.metadata.first_name,
          stripeCustomer.payload.metadata.last_name,
          await getValidUsername(session, `${stripeCustomer.payload.metadata.first_name}${stripeCustomer.payload.metadata.last_name}`),
          stripeCustomer.payload.email,
          generate(),
          false,
          [],
          [],
          null,
          null,
          stripeCustomer.payload.metadata.phone,
          uniq(product.roles.concat(['Affiliate'])),
          [],
          new StripeData(stripeCustomer.payload.id, subscription.id, stripeProduct.payload.id, stripePlan.payload.id, subscription.status, paymentAccountKey),
          address,
          null
        );
        user.ancestry.depth = 1;
        await session.store(user);
        await session.saveChanges();

        await sendTripValetWelcome(user, user.password, session);
        if (
          some(product.roles, (role: string) => {
            return role.startsWith('TVI');
          })
        ) {
          await sendTripValetIncentivesWelcome(user, user.password, session);
        }
      }

      try {
        if (user.sponsor) {
          const affiliate = await session.load<User>(user.sponsor.id);
          if (
            affiliate &&
            DateTime.fromISO(affiliate.createdAt.toUTCString())
              .diffNow('days')
              .toObject().days < 30
          ) {
            affiliate.threeForFreeUserIds.push(user.id);
            await session.saveChanges();
          }
        }
      } catch (ex) {
        const dumpBucket = new DumpBucket(null, null, {
          function: 'processCustomerSubscriptionCreated Trying to add threeForFreeUserIds',
          exception: ex,
        });
        await session.store(dumpBucket);
        await session.saveChanges();
      }
      if (user) {
        const customerSubscription = new UserSubscription(
          'Stripe',
          new UserReference(user.id, user.email, user.firstName, user.lastName),
          subscription.id,
          subscription.status,
          moment.unix(subscription.start).toDate(),
          moment.unix(subscription.current_period_start).toDate(),
          moment.unix(subscription.current_period_end).toDate(),
          paymentAccountKey,
          new UserStripeSubscription(
            subscription.id,
            new StripeCustomerReference(stripeCustomer.payload.id, stripeCustomer.payload.email),
            new StripePlanReference(
              stripePlan.payload.id,
              stripePlan.payload.nickname,
              stripePlan.payload.interval,
              stripePlan.payload.interval_count,
              stripePlan.payload.amount,
              stripePlan.payload.product.toString()
            ),
            new StripeProductReference(stripeProduct.payload.id, stripeProduct.payload.name)
          ),
          user.sponsor
        );
        customerSubscription.id = `${user.id}/subscriptions/${subscription.id}`;
        if (subscription.metadata && subscription.metadata.hasOwnProperty('referralCode')) {
          customerSubscription.referrerCode = subscription.metadata['referralCode'];
        }
        if (user.roles.indexOf('CoinMD Member') > -1) {
          customerSubscription.isRevenueShare = true;
        }

        const webHook = new StripeWebhook(
          subscription.id,
          event.type,
          event,
          null,
          new UserReference(user.id, user.email, user.firstName, user.lastName),
          user.sponsor ? new UserReference(user.sponsor.id, user.sponsor.email, user.sponsor.firstName, user.sponsor.lastName) : null
        );
        await session.store(webHook);
        await session.saveChanges();

        user.active = true;
        await session.store(customerSubscription);
        await session.saveChanges();
        return customerSubscription;
      } else {
        return null;
      }
    } catch (ex) {
      await session.store(
        await createAndSendException(subscription.id, new Error(ex.message).stack, ex.message, {
          function: 'processCustomerSubscriptionCreated()',
          event,
        })
      );
      await session.saveChanges();
      return null;
    }
  } catch (ex) {
    await session.store(
      await createAndSendException(event.id, new Error(ex.message).stack, ex.message, {
        function: 'processCustomerSubscriptionCreated()',
        event,
      })
    );
    await session.saveChanges();
    return null;
  }
};

export const processCustomerSubscriptionUpdated = async (
  session: IDocumentSession,
  event: Stripe.events.IEvent,
  paymentAccountKey: PaymentAccountEnum
): Promise<any> => {
  try {
    const subscription = <Stripe.subscriptions.ISubscription>event.data.object;
    try {
      const userSubscription = await session
        .query<UserSubscription>({ collection: 'UserSubscriptions' })
        .whereEquals('subscriptionId', subscription.id)
        .include('user.id')
        .firstOrNull();

      if (userSubscription) {
        userSubscription.currentPeriodStart = moment.unix(subscription.current_period_start).toDate();
        userSubscription.currentPeriodEnd = moment.unix(subscription.current_period_end).toDate();
        userSubscription.status = subscription.status;
        userSubscription.updatedAt = getNowUtc();
        userSubscription.paymentAccountKey = paymentAccountKey;

        if (subscription.metadata && subscription.metadata.hasOwnProperty('referralCode')) {
          userSubscription.referrerCode = subscription.metadata['referralCode'];
        }

        await session.saveChanges();

        const user = await session.load<User>(userSubscription.user.id);
        if (user.sorAccount) {
          if (subscription.status === 'past_due' || subscription.status === 'canceled') {
            await sorDeactivateMember(sorGetApiCredentials(user.roles), user.email, user.sorAccount.contractNumber);
            user.active = false;
          } else if (!user.active && subscription.status === 'active') {
            user.active = true;
            await sorActivateMember(sorGetApiCredentials(user.roles), user.email, user.sorAccount.contractNumber);
          }
        } else {
          // should we send an email?
          await createAndSendException(
            event.id,
            new Error('user.sorAccount is null or undefined').stack,
            `Unable to activate or deactivate user due to user.sorAccount being null or undefined > ${user.id}`,
            {
              function: 'processCustomerSubscriptionUpdated()',
              event,
              user,
              subscription,
              userSubscription,
            },
            true
          );
        }

        const webHook = new StripeWebhook(
          subscription.id,
          event.type,
          event,
          null,
          new UserReference(user.id, user.email, user.firstName, user.lastName),
          user.sponsor ? new UserReference(user.sponsor.id, user.sponsor.email, user.sponsor.firstName, user.sponsor.lastName) : null
        );
        await session.store(webHook);
        await session.store(user);
        await session.saveChanges();
      }

      return userSubscription;
    } catch (ex) {
      await session.store(
        await createAndSendException(subscription.id, new Error(ex.message).stack, ex.message, {
          function: 'processCustomerSubscriptionUpdated()',
          event,
        })
      );
      await session.saveChanges();
      return null;
    }
  } catch (ex) {
    await session.store(
      await createAndSendException(event.id, new Error(ex.message).stack, ex.message, {
        function: 'processCustomerSubscriptionUpdated()',
        event,
      })
    );
    await session.saveChanges();
    return null;
  }
};

export const listAllCards = async (userId: string, paymentKey: string): Promise<Stripe.cards.ICard[]> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const res = await stripe.customers.listCards(userId);
  return res.data;
};

export const createCreditCardAndUpdateDefaultSource = async (
  userId: string,
  saleInfo: ISaleInfo,
  address: Address,
  paymentKey: string
): Promise<ICreateSourceResult> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const customer = await stripe.customers.retrieve(userId);
  const card = await createCardSource(customer, saleInfo, address, paymentKey);
  await updateDefaultSource(customer.id, card.payload.id, paymentKey);
  return card;
};

export const updateDefaultSource = async (customerId: string, cardId: string, paymentKey: string) => {
  const userToUpdate: customers.ICustomerUpdateOptions = {
    default_source: cardId,
  };
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.customers.update(customerId, userToUpdate);
};

export const updateCard = async (
  cardId: string,
  customerId: string,
  saleInfo: ISaleInfo,
  address: Address,
  paymentKey: string
): Promise<Stripe.cards.ICard> => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  const infoToUpdate: Stripe.cards.ICardUpdateOptions = {
    address_city: address.address,
    address_line1: address.zip,
    address_country: address.country,
    address_state: address.state,
    address_zip: address.zip,
    exp_month: +saleInfo.ccExpMonth,
    exp_year: +saleInfo.ccExpYear,
    name: `${saleInfo.firstNameOnCard} ${saleInfo.lastNameOnCard}`,
  };
  return stripe.customers.updateCard(customerId, cardId, infoToUpdate);
};

export const getCardById = async (customerId: string, cardId: string, paymentKey: string) => {
  const stripe = new Stripe(getPaymentAPIKey(paymentKey) || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');
  return stripe.customers.retrieveCard(customerId, cardId);
};
// moment.unix(yourUnixEpochTime).format('dddd, MMMM Do, YYYY h:mm:ss A')
