import { reverse, filter, some, cloneDeep, uniq, find } from 'lodash';

import { Funnel, Links, UpgradeMembershipYepArgs } from '@/types/funnel';
import { IDocumentSession } from 'ravendb';
import { User, UserReference, StripeData, MaxlineUser, TransferUser, MaxlineTransfer } from '@/types/user';
import { Sponsor } from '@/types/sponsor';
import { Ancestry } from '@/types/ancestry';
import { RegisterAndSubscribeArgs } from '@/types/funnel/RegisterAndSubscribeInput';
import { PaymentAccountEnum } from '@/types/Enums';
import { DumpBucket } from '@/types/dumpBucket';
import { updateMailChimpUser, addToMailChimpWhenSubscribed } from './mailchimp';
import { Product } from '@/types/product';
import { Lead } from '@/types/lead/Lead';
import {
  createToken,
  createCustomer,
  getPlan,
  createSubscription,
  createCharge,
  getCustomerByEmailAddress,
  cancelSubscription,
  getInvoice,
  getPaymentIntent,
  createInvoiceItem,
  createPaymentMethod,
  getCustomer,
  getSubscriptionByPlan,
} from './stripe';
import { sendCertificateEmail } from './prospect';
import { SaleInfo, ICookieSession } from './interfaces';
import * as Utils from '@/helpers/utils';
import { UserWithPassword } from '@/types/user/UserWithPassword';
import gravatar = require('gravatar');
import { AddProspectArgs } from '@/types/prospect';
import { FunnelStep } from '@/types/funnel/FunnelStep';
import { RegisterItexArgs } from '@/types/funnel/RegisterItexArgs';
import { RegisterAndSubscribeResponse } from '@/types/funnel/RegisterAndSubscribeResponse';
import { RegisterAndSubscribeYepArgs } from '@/types/funnel/RegisterAndSubscribeYepArgs';
import { Binary } from '@/types/user/Binary';
import { transferUser } from '@/helpers/userTransfer';
import zipcodes from 'zipcodes';
import { Exception } from '@/types/exception';
import { YepCutoff } from '@/types/yepCutoff';

const axios = require('axios');
const AWS = require('aws-sdk');

export const INFO_TRIPVALETINCENTIVES = 'TripValet Incentives<info@tripvaletincentives.com>';
export const SUBSCRIBE_TEMPLATE = 'SubcribeTemplate';
const MAILCHIMPLIST_ID = 'c1acd249ef';

export const getProductFromUserRoles = (userRoles: string[], rolesToLookFor: string[]): string => {
  const roleFound = filter(userRoles, role => {
    return some(rolesToLookFor, role);
  });

  return roleFound.toString();
};

export const registerAndSubscribe = async (
  session: IDocumentSession,
  args: RegisterAndSubscribeArgs,
  paymentAccountKey: PaymentAccountEnum
): Promise<RegisterAndSubscribeResponse> => {
  const argsMasked = cloneDeep(args);
  const regex = /\d(?=\d{4})/gm;
  argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');

  const inbound = new DumpBucket(null, 'registerAndSubscribe', {
    location: {
      message: 'Inbound Funnel Order',
      const: 'users.ts > registerAndSubscribe()',
    },
    args: argsMasked,
  });
  await session.store(inbound);
  await session.saveChanges();
  session.advanced.evict(inbound);

  const {
    values: { user, address, product: productId, card, couponCode },
    fid,
    aid,
    step,
    notes,
    luid,
  } = args;
  const requestedOnboardingCall = args.requestedOnboardingCall ? args.requestedOnboardingCall : false;

  let customer = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('email', user.email)
    .firstOrNull();

  if (args.values.interests) {
    updateMailChimpUser(session, args.values.user.email, 'eebfcc06d2', args.values.interests, true);
  }

  try {
    const product = await session.load<Product>(productId);
    session.advanced.evict(product);
    let sponsor: User;
    let coupon: string = null;

    if (customer && customer.active) {
      // TODO User already exists and is active
      // TODO Do we upgrade them or what is going on?\
      throw new Error('You already have an account.');
    } else if (!customer) {
      if (aid || aid !== '') {
        sponsor = await session
          .query<User>({ indexName: 'Users' })
          .whereEquals('uuid', aid)
          .firstOrNull();
        session.advanced.evict(sponsor);
      }

      let username = `${user.firstName.trim()}${user.lastName.trim()}`.replace(/\s/g, '').toLowerCase();
      username = await Utils.getValidUsername(session, username);

      // create the user
      customer = new User(
        Utils.getShortUuid(),
        Utils.capitalizeEachFirstLetter(user.firstName),
        Utils.capitalizeEachFirstLetter(user.lastName),
        username,
        user.email.trim().toLowerCase(),
        user.password,
        false,
        [],
        [],
        null,
        true,
        user.phone.trim(),
        [...product.roles],
        [],
        null,
        address
      );
      customer.notes = notes;
      await session.store(customer);
      if (sponsor) {
        customer.sponsor = new Sponsor(sponsor.id, sponsor.email, sponsor.firstName, sponsor.lastName);
        customer.ancestry = new Ancestry(sponsor.ancestry.depth + 1, sponsor.id, appendUserIdToAncestors(sponsor.id, sponsor.ancestry.ancestors));

        const ancestors = getAncestorLevelsUp(customer.ancestry.ancestors);
        if (ancestors.length > 2) {
          const grandSponsor = await session.load<User>(ancestors[1]);
          const grandSponsorEmail = grandSponsor.email;
          // Direct Referral
          const directData = {
            memberFirstName: sponsor.firstName,
            affiliateName: `${customer.firstName} ${customer.lastName}`,
            uuid: sponsor.uuid,
          };
          sendSESMail(INFO_TRIPVALETINCENTIVES, sponsor.email, 'DirectReferalTemplate', directData);

          // Referral's Referral
          const doubleData = {
            memberFirstName: grandSponsor.firstName,
            affiliateName: `${sponsor.firstName} ${sponsor.lastName}`,
            uuid: grandSponsor.uuid,
          };
          sendSESMail(INFO_TRIPVALETINCENTIVES, grandSponsorEmail, 'DoubleReferalTemplate', doubleData);
        }
      } else {
        customer.ancestry = new Ancestry(1);
      }
      await session.saveChanges();

      if (requestedOnboardingCall) {
        sendSESOnboardingMail(user, INFO_TRIPVALETINCENTIVES, 'support@tripvalet.com', product.displayName, 'OnBoardTemplate');
      }
    } else {
      customer.address = address;
      customer.phone = user.phone.trim();
      customer.roles = uniq(customer.roles ? customer.roles.concat(product.roles) : [...product.roles]);
      await session.saveChanges();
    }

    // console.log('before', couponCode, paymentAccountKey);
    try {
      if (couponCode) {
        if (paymentAccountKey === PaymentAccountEnum.TripValetLLC) {
          // console.log('paymentAccountKey === PaymentAccountEnum.TripValetLLC');
          if (couponCode.toLowerCase() === '20off' || couponCode.toLowerCase() === '50off') {
            coupon = couponCode.toLowerCase();
          }
        } else if (paymentAccountKey === PaymentAccountEnum.TripValetIncentives) {
          // console.log('paymentAccountKey === PaymentAccountEnum.TripValetIncentives');
          if (couponCode.toUpperCase() === 'TVIPRO12' || couponCode.toUpperCase() === 'TVIPRO6' || couponCode.toUpperCase() === 'TVIPRO3') {
            coupon = couponCode.toUpperCase();
          }
        }
      }
    } catch (ex) {
      await session.store(
        await Utils.createAndSendException(null, null, new Error(ex.message).stack, {
          errorMessage: ex.message,
          user,
          argsMasked,
        })
      );
    }
    // console.log('coupon', coupon);

    const lead = await session
      .query<Lead>({ indexName: 'Leads' })
      .whereEquals('uuid', luid)
      .firstOrNull();

    if (lead) {
      lead.user = new UserReference(customer.id, customer.email, customer.firstName, customer.lastName);
    }
    const stripeToken = await createToken(card, customer.address, customer, paymentAccountKey);
    if (!stripeToken.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }
    const stripeCustomer = await createCustomer(
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      product.amount,
      stripeToken.payload.id,
      paymentAccountKey
    );
    if (!stripeCustomer.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeCustomer.exception));
      await session.saveChanges();
      throw new Error(stripeCustomer.exception.errorMessage);
    } else if (stripeCustomer.success && stripeCustomer.exception) {
      await Utils.sendException(stripeCustomer.exception, true);
    }

    // if (product.setup.fee > 0) {
    //   let stripeCharge = await createCharge(stripeCustomer.payload, new SaleInfo(customer.email, customer.firstName, customer.lastName, card.number, card.month, card.year, card.cvc, product.setup.fee * 100, customer.uuid), stripeToken.payload.card.id, product.setup.description);
    //   if (!stripeCharge.success) {
    //     customer.active = false;
    //     customer.updatedAt = Utils.getNowUtc();
    //     await session.store(await Utils.sendException(stripeCharge.exception));
    //     await session.saveChanges();
    //     throw new Error(stripeCharge.exception.errorMessage);
    //   }
    // }

    const stripePlan = await getPlan(product.plan.id, paymentAccountKey);
    if (!stripePlan.success) {
      await session.store(await Utils.sendException(stripePlan.exception));
      await session.saveChanges();
      throw new Error(stripePlan.exception.errorMessage);
    }

    const createSubscriptionResult = await createSubscription(
      stripeCustomer.payload.id,
      stripePlan.payload,
      paymentAccountKey,
      args.values.referralCode,
      coupon,
      { userId: customer.id, productId: product.id, requestedOnboardingCall: Boolean(requestedOnboardingCall).toString() }
    );
    if (!createSubscriptionResult.success) {
      await session.store(await Utils.sendException(createSubscriptionResult.exception));
      await session.saveChanges();
      throw new Error(createSubscriptionResult.exception.errorMessage);
    }

    customer.active = true;
    customer.updatedAt = Utils.getNowUtc();
    customer.stripe = new StripeData(
      stripeCustomer.payload.id,
      createSubscriptionResult.payload.id,
      product.product.id,
      stripePlan.payload.id,
      createSubscriptionResult.payload.status,
      paymentAccountKey
    );
    // , new UserStripeSubscription(, new StripeCustomerReference(stripeCustomer.payload.id, stripeCustomer.payload.email), new StripePlanSummary(stripePlan.payload.amount, stripePlan.payload.id, product.product.id, stripePlan.payload.interval, stripePlan.payload.interval_count, stripePlan.payload.nickname), new StripeProductReference(product.product.id, product.product.name));
    //  {
    //   "subscriptionId": createSubscriptionResult.payload.id,
    //   "start": "2018-07-20T03:46:10.0000000Z",
    //   "currentPeriodStart": "2018-10-20T03:46:10.0000000Z",
    //   "currentPeriodEnd": "2018-11-20T03:46:10.0000000Z",
    //   "customer": {
    //       "id": "cus_DGMH8KTroDlquG",
    //       "email": "pyattandassociates@gmail.com"
    //   },
    //   "plan": {
    //       "id": "plan_DCob1bM2Ue8qMH",
    //       "nickname": "TVI - PRO",
    //       "interval": "month",
    //       "intervalCount": 1,
    //       "amount": 9700,
    //       "product": "prod_DCobDzIDQdBlVI"
    //   },
    //   "product": {
    //       "id": "prod_DCobDzIDQdBlVI",
    //       "name": "TVI - PRO"
    //   }
    // });
    await session.saveChanges();
    // New enrollment AXIOS post
    await axios
      .post('https://tripvalet.membertek.com/external-api/new-enrollment', { ID: customer.uuid, Email: customer.email })
      .then(() => {
        // console.log(response);
      })
      .catch(() => {
        // console.log(error);
      });
    // Add to Mailchimp list
    const mergeFields = {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    };
    await addToMailChimpWhenSubscribed(session, mergeFields, MAILCHIMPLIST_ID);
    // send emails
    await Utils.sendTripValetWelcome(customer, user.password, session);
    if (
      some(product.roles, (role: string) => {
        return role.startsWith('TVI');
      })
    ) {
      await Utils.sendTripValetIncentivesWelcome(customer, user.password, session);
    }

    if (args.values.certificate) {
      const sendEmailReference: AddProspectArgs = {
        certificateId: args.values.certificate,
        deliveryEndpoint: args.values.user.email,
        firstName: args.values.user.firstName,
        lastName: args.values.user.lastName,
        personalizedMessage: null,
        phone: args.values.user.phone,
      };
      await sendCertificateEmail(session, sendEmailReference, aid);
    }

    const funnel = await session.load<Funnel>(fid);
    const funnelStep = find(funnel.funnelSteps, (funnelStep: FunnelStep) => {
      return funnelStep.stepOrder === step;
    });

    return { success: true, nextFunnelStepUrl: funnelStep.nextFunnelStepUrl };
  } catch (ex) {
    const argsMasked = args;
    const regex = /\d(?=\d{4})/gm;
    argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');
    await session.store(await Utils.createAndSendException(null, null, new Error(ex.message).stack, { errorMessage: ex.message, user, argsMasked }));
    await session.saveChanges();
    throw ex;
  }
};

export const registerAndSubscribeYep = async (
  session: IDocumentSession,
  args: RegisterAndSubscribeYepArgs,
  paymentAccountKey: PaymentAccountEnum
): Promise<RegisterAndSubscribeResponse> => {
  const location = zipcodes.lookup(args.values.address.zip);
  if (!location) {
    // throw new Error('Zip code invalid!');
    console.log('Not a zipcode from US or Canada.');
  }

  const localEventId = Utils.getShortUuid();

  const argsMasked = cloneDeep(args);
  const regex = /\d(?=\d{4})/gm;
  argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');

  const {
    values: { user, address, product: productId, card },
    aid,
    fid,
    luid,
    requestType,
  } = args;

  const inbound = new DumpBucket(null, `[${localEventId}][inbound] ${user.email}`, {
    location: {
      message: 'Inbound Funnel Order',
      const: 'users.ts > registerAndSubscribe()',
    },
    args: argsMasked,
    requestType,
    aid,
    fid,
    luid,
  });
  await session.store(inbound);
  await session.saveChanges();
  session.advanced.evict(inbound);

  let customer = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('email', user.email)
    .firstOrNull();

  const lead = await session
    .query<Lead>({ indexName: 'Leads' })
    .whereEquals('uuid', luid)
    .firstOrNull();

  let maxlineIds: string[] | null = null;
  if (lead && lead.uuid !== '') {
    maxlineIds = lead.uuid.indexOf('-') > 0 ? lead.uuid.split('-') : null;
  }

  let sponsor: User | null = null;
  let maxlineTransfer: MaxlineTransfer | null = null;

  if (maxlineIds && maxlineIds.length === 1) {
    maxlineTransfer = await session
      .query<MaxlineTransfer>({ indexName: 'MaxlineTransfers' })
      .whereEquals('token', maxlineIds[0])
      .firstOrNull();

    if (maxlineTransfer) {
      sponsor = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('maxlineId', maxlineIds[1])
        .firstOrNull();
    }
  } else {
    if (maxlineIds && maxlineIds.length > 1) {
      sponsor = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('maxlineId', maxlineIds[1])
        .firstOrNull();
    }
  }

  const logEntry = new DumpBucket(null, `[${localEventId}][logEntry] ${user.email}`, {
    maxlineIds,
    maxLineTransfer: maxlineTransfer,
    customer: customer ? customer : { user: 'Not Found' },
    lead,
    sponsor,
    requestType,
    aid,
    fid,
    luid,
    argsMasked,
  });
  await session.store(logEntry);
  await session.saveChanges();

  try {
    const product = await session.load<Product>(productId);

    if (!customer) {
      let username = maxlineTransfer ? maxlineTransfer.username : `${user.firstName.trim()}${user.lastName.trim()}`.replace(/\s/g, '').toLowerCase();
      username = await Utils.getValidUsername(session, username);

      // create the user
      customer = new User(
        Utils.getShortUuid(),
        Utils.capitalizeEachFirstLetter(user.firstName),
        Utils.capitalizeEachFirstLetter(user.lastName),
        username,
        user.email.trim().toLowerCase(),
        user.password,
        false,
        [],
        [],
        null,
        true,
        user.phone.trim(),
        [...product.roles],
        [],
        null,
        address
      );

      customer.birthDay = user.birthDay;

      await session.store(customer);

      if (sponsor && sponsor.ancestry) {
        customer.maxlineUser = new MaxlineUser(
          maxlineTransfer ? maxlineTransfer.yepId : Utils.getShortUuid(),
          sponsor.id,
          null,
          null,
          null,
          maxlineTransfer ? maxlineTransfer.maxlineId : maxlineIds ? maxlineIds[0] : null,
          maxlineTransfer ? maxlineTransfer.maxlineEnrollerId : maxlineIds ? maxlineIds[1] : null
        );

        try {
          if (sponsor.binary && sponsor.binary.depth && sponsor.binary.placement) {
            customer.binary = new Binary(sponsor.binary.depth + 1, sponsor.id, `${sponsor.binary.placement}.2`, 'Right');
          }
          customer.sponsor = new Sponsor(sponsor.id, sponsor.email, sponsor.firstName, sponsor.lastName);
          customer.ancestry = new Ancestry(sponsor.ancestry.depth + 1, sponsor.id, appendUserIdToAncestors(sponsor.id, sponsor.ancestry.ancestors));
        } catch (ex) {
          await session.store(
            await Utils.createAndSendException('registerAndSubscribeYep > sponsor > ancestry > handled', new Error(ex).stack, ex.message, {
              argsMasked,
              customer,
              sponsor,
            })
          );
          await session.saveChanges();
        }
      } else {
        customer.maxlineUser = new MaxlineUser(
          maxlineTransfer ? maxlineTransfer.yepId : Utils.getShortUuid(),
          null,
          null,
          null,
          null,
          maxlineTransfer ? maxlineTransfer.maxlineId : maxlineIds ? maxlineIds[0] : null,
          maxlineTransfer ? maxlineTransfer.maxlineEnrollerId : maxlineIds ? maxlineIds[1] : null
        );
        customer.ancestry = new Ancestry(1);
        customer.binary = new Binary(1, '', '', 'Right');
      }
      const customerAdded = new DumpBucket(null, `[${localEventId}][customerAdded] ${user.email}`, {
        maxlineIds,
        maxLineTransfer: maxlineTransfer,
        customer: customer ? customer : { user: 'Not Found' },
        lead,
        sponsor,
        requestType,
        aid,
        fid,
        luid,
        argsMasked,
      });
      await session.store(customerAdded);
      await session.saveChanges();
    } else {
      customer.maxlineUser = new MaxlineUser(
        maxlineTransfer ? maxlineTransfer.yepId : Utils.getShortUuid(),
        null,
        null,
        null,
        null,
        maxlineTransfer ? maxlineTransfer.maxlineId : maxlineIds ? maxlineIds[0] : null,
        maxlineTransfer ? maxlineTransfer.maxlineEnrollerId : maxlineIds ? maxlineIds[1] : null
      );
      customer.binary = new Binary(1, '', '', 'Right');

      // customer.uuid = lead ? lead.uuid : Utils.getShortUuid();
      customer.address = address;
      customer.phone = user.phone.trim();
      customer.roles = uniq(customer.roles ? customer.roles.concat(product.roles) : [...product.roles]);
      customer.password = user.password;
      customer.birthDay = user.birthDay;

      const customerUpdated = new DumpBucket(null, `[${localEventId}][customerUpdated] ${user.email}`, {
        maxlineIds,
        maxLineTransfer: maxlineTransfer,
        customer: customer ? customer : { user: 'Not Found' },
        lead,
        sponsor,
        requestType,
        aid,
        fid,
        luid,
        argsMasked,
      });
      await session.store(customerUpdated);
      await session.saveChanges();
    }

    if (location) {
      customer.coordinate = { lat: location.latitude, lng: location.longitude };
    }
    await session.saveChanges();

    if (requestType === 'SCA_SUCCESS') {
      const { paymentIntentId } = args;
      if (!paymentIntentId) {
        const errMessage = 'Payment Intent not provided!';
        await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
        await session.saveChanges();
        throw new Error(errMessage);
      }

      const paymentIntentResult = await getPaymentIntent(paymentIntentId, paymentAccountKey);
      if (paymentIntentResult.status !== 'succeeded') {
        const errMessage = `Payment Failed! Intent status : ${paymentIntentResult.status}`;
        await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
        await session.saveChanges();
        throw new Error(errMessage);
      }
      console.log(paymentIntentResult.status);

      customer.active = true;
      customer.updatedAt = Utils.getNowUtc();
      session.saveChanges();

      if (maxlineIds) {
        let mibProduct: string = '';
        switch (product.displayName) {
          case 'YEP Basic Plan':
            mibProduct = 'YEP-Basic';
            break;
          case 'YEP Starter Plan':
            mibProduct = 'YEP-Starter';
            break;
          case 'YEP Business Plan':
            mibProduct = 'YEP-Business';
            break;
          case 'YEP Pro Plan':
          case 'YEP Founders Plan - Limited':
            mibProduct = 'YEP-Pro';
            break;
          default:
            break;
        }

        await axios
          .get(
            `https://myyeptribe.com/api/2.0/?key=EwRtGXeTgulb9JaRLZCEKJzMrspev8y7&yepId=${customer.maxlineUser.yepId}&id=${customer.maxlineUser.maxlineId}&enrollerId=${customer.maxlineUser.maxlineEnrollerId}&product=${mibProduct}`
          )
          .then(() => {
            // console.log(response);
          })
          .catch(() => {
            // console.log(error);
          });

        // Save YepCutoff for Sponsor Placement

        // w7gRegisterAndPayUser(customer, sponsor, session);

        const cutOff: YepCutoff = new YepCutoff(
          null,
          customer.id,
          sponsor.id,
          `${customer.firstName} ${customer.lastName}`,
          customer.email,
          product.displayName
        );
        cutOff.createdAt = Utils.getNowUtc();

        await session.store(cutOff);
        await session.saveChanges();
      }

      try {
        // Add to MailChimp list
        const mergeFields = {
          email: customer.email,
          firstName: customer.firstName,
          lastName: customer.lastName,
          phone: customer.phone,
        };
        await addToMailChimpWhenSubscribed(session, mergeFields, MAILCHIMPLIST_ID);
      } catch (ex) {
        await session.store(
          await Utils.createAndSendException('addToMailChimpWhenSubscribed()', new Error(ex.message).stack, ex.message, {
            errorMessage: ex.message,
            user,
            argsMasked,
          })
        );
        await session.saveChanges();
      }

      try {
        // send welcome email
        await Utils.sendYepWelcome(customer, user.password);
      } catch (ex) {
        const argsMasked = args;
        const regex = /\d(?=\d{4})/gm;
        argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');
        await session.store(
          await Utils.createAndSendException('Utils.sendYepWelcome()', new Error(ex.message).stack, ex.message, { errorMessage: ex.message, user, argsMasked })
        );
        await session.saveChanges();
      }

      if (args.values.certificate) {
        const sendEmailReference: AddProspectArgs = {
          certificateId: args.values.certificate,
          deliveryEndpoint: args.values.user.email,
          firstName: args.values.user.firstName,
          lastName: args.values.user.lastName,
          personalizedMessage: null,
          phone: args.values.user.phone,
        };
        await sendCertificateEmail(session, sendEmailReference, aid);
      }

      const funnel = await session.load<Funnel>(fid);
      const funnelStep = find(funnel.funnelSteps, (funnelStep: FunnelStep) => {
        return funnelStep.stepOrder === 1;
      });

      const scaSuccess = new DumpBucket(null, `[${localEventId}][scaSuccess] ${user.email}`, {
        maxlineIds,
        maxLineTransfer: maxlineTransfer,
        customer: customer ? customer : { user: 'Not Found' },
        lead,
        sponsor,
        requestType,
        aid,
        fid,
        luid,
        argsMasked,
      });
      await session.store(scaSuccess);
      await session.saveChanges();

      return { success: true, nextFunnelStepUrl: funnelStep.nextFunnelStepUrl };
    } else if (requestType === 'SCA_FAIL') {
      const errMessage = 'Strong Customer Authentication Failed!';
      await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
      await session.saveChanges();

      const scaFailed = new DumpBucket(null, `[${localEventId}][scaFailed] ${user.email}`, {
        maxlineIds,
        maxLineTransfer: maxlineTransfer,
        customer: customer ? customer : { user: 'Not Found' },
        lead,
        sponsor,
        requestType,
        aid,
        fid,
        luid,
        argsMasked,
      });
      await session.store(scaFailed);
      await session.saveChanges();

      throw new Error(errMessage);
    }

    const scaInitial = new DumpBucket(null, `[${localEventId}][scaInitial] ${user.email}`, {
      maxlineIds,
      maxLineTransfer: maxlineTransfer,
      customer: customer ? customer : { user: 'Not Found' },
      lead,
      sponsor,
      requestType,
      aid,
      fid,
      luid,
      argsMasked,
    });
    await session.store(scaInitial);
    await session.saveChanges();

    const stripeToken = await createToken(card, customer.address, customer, paymentAccountKey);
    if (!stripeToken.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }
    const createPaymentMethodResult = await createPaymentMethod(card, paymentAccountKey);
    if (!createPaymentMethodResult.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(createPaymentMethodResult.exception));
      await session.saveChanges();
      throw new Error(createPaymentMethodResult.exception.errorMessage);
    }

    const stripeCustomer = await createCustomer(
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      product.amount,
      stripeToken.payload.id,
      paymentAccountKey,
      { yepUuid: lead ? lead.uuid : null },
      createPaymentMethodResult.payload.id
    );

    if (!stripeCustomer.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeCustomer.exception));
      await session.saveChanges();
      throw new Error(stripeCustomer.exception.errorMessage);
    } else if (stripeCustomer.success && stripeCustomer.exception) {
      await Utils.sendException(stripeCustomer.exception, true);
    }

    if (product.setup.fee > 0) {
      const createInvoiceItemResult = await createInvoiceItem(product.setup.fee * 100, stripeCustomer.payload.id, product.setup.description, paymentAccountKey);
      if (!createInvoiceItemResult.success) {
        customer.active = false;
        customer.updatedAt = Utils.getNowUtc();
        await session.store(await Utils.sendException(createInvoiceItemResult.exception));
        await session.saveChanges();
        throw new Error(createInvoiceItemResult.exception.errorMessage);
      }
    }

    const stripePlan = await getPlan(product.plan.id, paymentAccountKey);
    // let stripePlan = await getPlan('prod_G1BV0RoARfluPN', paymentAccountKey);
    if (!stripePlan.success) {
      // stripePlan = await createTestPlan(paymentAccountKey);
      await session.store(await Utils.sendException(stripePlan.exception));
      await session.saveChanges();
      throw new Error(stripePlan.exception.errorMessage);
    }

    const createSubscriptionResult = await createSubscription(
      stripeCustomer.payload.id,
      stripePlan.payload,
      paymentAccountKey,
      args.values.referralCode,
      null,
      { userId: customer.id, productId: product.id, yepUuid: lead ? lead.uuid : null }
    );

    if (!createSubscriptionResult.success) {
      await session.store(await Utils.sendException(createSubscriptionResult.exception));
      await session.saveChanges();
      throw new Error(createSubscriptionResult.exception.errorMessage);
    }

    const latestInvoice = createSubscriptionResult.payload.latest_invoice;
    const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice.id;
    const invoice = await getInvoice(invoiceId, paymentAccountKey);

    const paymentIntentId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;
    const paymentIntent = await getPaymentIntent(paymentIntentId, paymentAccountKey);

    customer.active = false;
    customer.updatedAt = Utils.getNowUtc();
    customer.stripe = new StripeData(
      stripeCustomer.payload.id,
      createSubscriptionResult.payload.id,
      product.product.id,
      stripePlan.payload.id,
      createSubscriptionResult.payload.status,
      paymentAccountKey
    );
    await session.saveChanges();

    const intentStatus: string = paymentIntent.status;
    console.log(paymentIntent.status);

    if (intentStatus === 'requires_action' || intentStatus === 'requires_confirmation' || intentStatus === 'requires_source_action') {
      // Ask SCA
      return { success: false, nextFunnelStepUrl: paymentIntent.client_secret };
    }

    if (intentStatus !== 'succeeded') {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(
        await Utils.sendException(new Exception(null, null, 'RegisterAndSubscribeYep', `Payment Intent Failed. Intent Status : ${intentStatus}`))
      );
      await session.saveChanges();
      throw new Error(`Payment Failed. Intent Status : ${intentStatus}`);
    }

    customer.active = true;
    customer.updatedAt = Utils.getNowUtc();
    session.saveChanges();

    if (maxlineIds) {
      let mibProduct: string = '';
      switch (product.displayName) {
        case 'YEP Basic Plan':
          mibProduct = 'YEP-Basic';
          break;
        case 'YEP Starter Plan':
          mibProduct = 'YEP-Starter';
          break;
        case 'YEP Business Plan':
          mibProduct = 'YEP-Business';
          break;
        case 'YEP Pro Plan':
        case 'YEP Founders Plan - Limited':
          mibProduct = 'YEP-Pro';
          break;
        default:
          break;
      }

      await axios
        .get(
          `https://myyeptribe.com/api/2.0/?key=EwRtGXeTgulb9JaRLZCEKJzMrspev8y7&yepId=${customer.maxlineUser.yepId}&id=${customer.maxlineUser.maxlineId}&enrollerId=${customer.maxlineUser.maxlineEnrollerId}&product=${mibProduct}`
        )
        .then(() => {
          // console.log(response);
        })
        .catch(() => {
          // console.log(error);
        });

      // Save YepCutoff for Sponsor Placement
      // w7gRegisterAndPayUser(customer, sponsor, session);
      const cutOff: YepCutoff = new YepCutoff(null, customer.id, sponsor.id, `${customer.firstName} ${customer.lastName}`, customer.email, product.displayName);
      cutOff.createdAt = Utils.getNowUtc();

      await session.store(cutOff);
      await session.saveChanges();
    }

    try {
      // Add to MailChimp list
      const mergeFields = {
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
      };
      await addToMailChimpWhenSubscribed(session, mergeFields, MAILCHIMPLIST_ID);
    } catch (ex) {
      await session.store(
        await Utils.createAndSendException('addToMailChimpWhenSubscribed()', new Error(ex.message).stack, ex.message, {
          errorMessage: ex.message,
          user,
          argsMasked,
        })
      );
      await session.saveChanges();
    }

    try {
      // send welcome email
      await Utils.sendYepWelcome(customer, user.password);
    } catch (ex) {
      const argsMasked = args;
      const regex = /\d(?=\d{4})/gm;
      argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');
      await session.store(
        await Utils.createAndSendException('Utils.sendYepWelcome()', new Error(ex.message).stack, ex.message, { errorMessage: ex.message, user, argsMasked })
      );
      await session.saveChanges();
    }

    if (args.values.certificate) {
      const sendEmailReference: AddProspectArgs = {
        certificateId: args.values.certificate,
        deliveryEndpoint: args.values.user.email,
        firstName: args.values.user.firstName,
        lastName: args.values.user.lastName,
        personalizedMessage: null,
        phone: args.values.user.phone,
      };
      await sendCertificateEmail(session, sendEmailReference, aid);
    }

    const funnel = await session.load<Funnel>(fid);
    const funnelStep = find(funnel.funnelSteps, (funnelStep: FunnelStep) => {
      return funnelStep.stepOrder === 1;
    });

    await session.store(scaInitial);
    await session.saveChanges();

    return { success: true, nextFunnelStepUrl: funnelStep.nextFunnelStepUrl };
  } catch (ex) {
    const argsMasked = args;
    const regex = /\d(?=\d{4})/gm;
    argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');
    await session.store(await Utils.createAndSendException(null, null, new Error(ex.message).stack, { errorMessage: ex.message, user, argsMasked }));
    await session.saveChanges();
    throw ex;
  }
};

export const upgradeMembership = async (session: IDocumentSession, args: UpgradeMembershipYepArgs): Promise<RegisterAndSubscribeResponse> => {
  const argsMasked = cloneDeep(args);
  const regex = /\d(?=\d{4})/gm;
  argsMasked.card.number = argsMasked.card.number.replace(regex, '*');

  const inbound = new DumpBucket(null, 'upgradeMembership', {
    location: {
      message: 'Inbound Funnel Order',
      const: 'users.ts > registerAndSubscribe()',
    },
    args: argsMasked,
  });
  await session.store(inbound);
  await session.saveChanges();

  const { address, product: productId, card, userId, currentProduct: currentProductId, requestType } = args;

  const user = await session.load<User>(userId);
  if (!user) {
    return { success: false, message: 'User not found!', nextFunnelStepUrl: '' };
  }

  let currentRole = '';
  currentRole = find(user.roles, r => {
    return r === Utils.Roles.YEPBasic;
  });
  currentRole = find(user.roles, r => {
    return r === Utils.Roles.YEPStarter;
  });
  currentRole = find(user.roles, r => {
    return r === Utils.Roles.YEPBusiness;
  });
  currentRole = find(user.roles, r => {
    return r === Utils.Roles.YEPFounder;
  });

  try {
    const newProduct = await session.load<Product>(productId);
    const currentProduct = await session.load<Product>(currentProductId);

    const paymentAccountKey = PaymentAccountEnum.YepWonder7Global;

    if (requestType === 'SCA_SUCCESS') {
      const { paymentIntentId } = args;
      if (!paymentIntentId) {
        const errMessage = 'Payment Intent not provided!';
        await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
        await session.saveChanges();
        throw new Error(errMessage);
      }

      const paymentIntentResult = await getPaymentIntent(paymentIntentId, paymentAccountKey);
      if (paymentIntentResult.status !== 'succeeded') {
        const errMessage = `Payment Failed! Intent status : ${paymentIntentResult.status}`;
        await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
        await session.saveChanges();
        throw new Error(errMessage);
      }
      console.log(paymentIntentResult.status);

      const stripeCustomerId = typeof paymentIntentResult.customer === 'string' ? paymentIntentResult.customer : paymentIntentResult.customer.id;

      const getStripeCustomerResult = await getCustomer(stripeCustomerId, paymentAccountKey);
      if (!getStripeCustomerResult.success) {
        await session.store(await Utils.sendException(getStripeCustomerResult.exception));
        await session.saveChanges();
        throw new Error(getStripeCustomerResult.exception.errorMessage);
      }

      const stripePlan = await getPlan(newProduct.plan.id, paymentAccountKey);
      if (!stripePlan.success) {
        await session.store(await Utils.sendException(stripePlan.exception));
        await session.saveChanges();
        throw new Error(stripePlan.exception.errorMessage);
      }

      const getSubscriptionResult = await getSubscriptionByPlan(getStripeCustomerResult.payload.id, stripePlan.payload.id, paymentAccountKey);
      if (!getSubscriptionResult) {
        const errMessage = `Failed to get subscription`;
        await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
        await session.saveChanges();
        throw new Error(errMessage);
      }

      // Upgrade payment success with sca confirmation
      user.stripe = new StripeData(
        getStripeCustomerResult.payload.id,
        getSubscriptionResult.id,
        newProduct.product.id,
        stripePlan.payload.id,
        getSubscriptionResult.status,
        paymentAccountKey
      );

      if (currentProduct && currentProduct.roles && user.roles) {
        currentProduct.roles.map(role => {
          const index = user.roles.indexOf(role);
          if (index > -1) {
            user.roles.splice(index, 1);
          }
        });
      } else {
        await session.store(
          await Utils.createAndSendException(null, 'upgradeMembership > user.roles > handled', 'currentProduct.roles.map', {
            currentProduct: currentProduct ? currentProduct : 'currentProduct not found',
            user,
          })
        );
        await session.saveChanges();
      }

      if (user.roles && newProduct && newProduct.roles) {
        user.roles = uniq(user.roles ? user.roles.concat(newProduct.roles) : [...newProduct.roles]);
      } else {
        await session.store(
          await Utils.createAndSendException(null, 'upgradeMembership > user.roles > handled', 'if (user.roles && newProduct.roles)', {
            newProduct: newProduct ? newProduct : 'newProduct not found',
            user,
          })
        );
        await session.saveChanges();
      }

      await session.saveChanges();

      // Transfer User
      if (currentRole === Utils.Roles.YEPStarter) {
        const userToTransfer: TransferUser = {
          fromRole: Utils.Roles.TVPlus,
          toRole: Utils.Roles.TVVip,
          email: user.email,
        };
        await transferUser(userToTransfer);
      }

      return { success: true, nextFunnelStepUrl: 'https://login.yeptribe.com' };
    } else if (requestType === 'SCA_FAIL') {
      const errMessage = 'Strong Customer Authentication Failed!';
      await session.store(await Utils.createAndSendException(null, null, new Error(errMessage).stack, { errorMessage: errMessage, user, argsMasked }));
      await session.saveChanges();
      throw new Error(errMessage);
    }

    const stripeToken = await createToken(card, address, user, paymentAccountKey);
    if (!stripeToken.success) {
      await session.store(await Utils.sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }

    const fee = newProduct.setup.fee - currentProduct.setup.fee;
    let stripeCustomer = await getCustomerByEmailAddress(user.email, paymentAccountKey);

    if (!stripeCustomer) {
      const createPaymentMethodResult = await createPaymentMethod(card, paymentAccountKey);
      if (!createPaymentMethodResult.success) {
        await session.store(await Utils.sendException(createPaymentMethodResult.exception));
        await session.saveChanges();
        throw new Error(createPaymentMethodResult.exception.errorMessage);
      }

      const customer = await createCustomer(
        user.email,
        user.firstName,
        user.lastName,
        user.phone,
        fee,
        stripeToken.payload.id,
        paymentAccountKey,
        null,
        createPaymentMethodResult.payload.id
      );

      if (!customer.success) {
        await session.store(await Utils.sendException(customer.exception));
        await session.saveChanges();
        throw new Error(customer.exception.errorMessage);
      } else if (customer.success && customer.exception) {
        await Utils.sendException(customer.exception, true);
      }

      stripeCustomer = customer.payload;
    }

    if (fee > 0) {
      const createInvoiceItemResult = await createInvoiceItem(fee * 100, stripeCustomer.id, newProduct.setup.description, paymentAccountKey);
      if (!createInvoiceItemResult.success) {
        await session.store(await Utils.sendException(createInvoiceItemResult.exception));
        await session.saveChanges();
        throw new Error(createInvoiceItemResult.exception.errorMessage);
      }
    }
    // const stripeCharge = await createCharge(
    //   stripeCustomer,
    //   new SaleInfo(user.email, user.firstName, user.lastName, card.number, card.month, card.year, card.cvc, fee * 100, user.uuid),
    //   stripeToken.payload.card.id,
    //   'YEP Membership Upgrade',
    //   paymentAccountKey
    // );

    // if (!stripeCharge.success) {
    //   user.updatedAt = Utils.getNowUtc();
    //   await session.store(await Utils.sendException(stripeCharge.exception));
    //   await session.saveChanges();
    //   throw new Error(stripeCharge.exception.errorMessage);
    // }

    const stripePlan = await getPlan(newProduct.plan.id, paymentAccountKey);
    // let stripePlan = await getPlan('prod_G1BV0RoARfluPN', paymentAccountKey);
    if (!stripePlan.success) {
      // stripePlan = await createTestPlan(paymentAccountKey);
      await session.store(await Utils.sendException(stripePlan.exception));
      await session.saveChanges();
      throw new Error(stripePlan.exception.errorMessage);
    }

    if (user.stripe.subscriptionId) {
      try {
        await cancelSubscription(user.stripe.subscriptionId, paymentAccountKey);
      } catch (ex) {
        console.log(`subscription ${user.stripe.subscriptionId} not found!`);
      }
    }

    const createSubscriptionResult = await createSubscription(stripeCustomer.id, stripePlan.payload, paymentAccountKey, null, null);
    if (!createSubscriptionResult.success) {
      await session.store(await Utils.sendException(createSubscriptionResult.exception));
      await session.saveChanges();
      throw new Error(createSubscriptionResult.exception.errorMessage);
    }

    const latestInvoice = createSubscriptionResult.payload.latest_invoice;
    const invoiceId = typeof latestInvoice === 'string' ? latestInvoice : latestInvoice.id;
    const invoice = await getInvoice(invoiceId, paymentAccountKey);

    const paymentIntentId = typeof invoice.payment_intent === 'string' ? invoice.payment_intent : invoice.payment_intent.id;
    const paymentIntent = await getPaymentIntent(paymentIntentId, paymentAccountKey);

    const intentStatus: string = paymentIntent.status;
    console.log(paymentIntent.status);

    if (intentStatus === 'requires_action' || intentStatus === 'requires_confirmation' || intentStatus === 'requires_source_action') {
      // Ask SCA
      return { success: false, nextFunnelStepUrl: paymentIntent.client_secret };
    }

    if (intentStatus !== 'succeeded') {
      await session.store(await Utils.sendException(new Exception(null, null, 'UpgradeMembership', `Payment Intent Failed. Intent Status : ${intentStatus}`)));
      await session.saveChanges();
      throw new Error(`Payment Failed. Intent Status : ${intentStatus}`);
    }

    // Success without SCA
    user.stripe = new StripeData(
      stripeCustomer.id,
      createSubscriptionResult.payload.id,
      newProduct.product.id,
      stripePlan.payload.id,
      createSubscriptionResult.payload.status,
      paymentAccountKey
    );

    if (currentProduct && currentProduct.roles && user.roles) {
      currentProduct.roles.map(role => {
        const index = user.roles.indexOf(role);
        if (index > -1) {
          user.roles.splice(index, 1);
        }
      });
    } else {
      await session.store(
        await Utils.createAndSendException(null, 'upgradeMembership > user.roles > handled', 'currentProduct.roles.map', {
          currentProduct: currentProduct ? currentProduct : 'currentProduct not found',
          user,
        })
      );
      await session.saveChanges();
    }

    if (user.roles && newProduct && newProduct.roles) {
      user.roles = uniq(user.roles ? user.roles.concat(newProduct.roles) : [...newProduct.roles]);
    } else {
      await session.store(
        await Utils.createAndSendException(null, 'upgradeMembership > user.roles > handled', 'if (user.roles && newProduct.roles)', {
          newProduct: newProduct ? newProduct : 'newProduct not found',
          user,
        })
      );
      await session.saveChanges();
    }

    await session.saveChanges();

    // Transfer User
    if (currentRole === Utils.Roles.YEPStarter) {
      const userToTransfer: TransferUser = {
        fromRole: Utils.Roles.TVPlus,
        toRole: Utils.Roles.TVVip,
        email: user.email,
      };
      await transferUser(userToTransfer);
    }

    return { success: true, nextFunnelStepUrl: 'https://login.yeptribe.com' };
  } catch (ex) {
    const argsMasked = args;
    const regex = /\d(?=\d{4})/gm;
    argsMasked.card.number = argsMasked.card.number.replace(regex, '*');
    await session.store(await Utils.createAndSendException(null, null, new Error(ex.message).stack, { errorMessage: ex.message, user, argsMasked }));
    await session.saveChanges();
    throw ex;
  }
};

export const registerItex = async (session: IDocumentSession, args: RegisterItexArgs, paymentAccountKey: PaymentAccountEnum) => {
  const argsMasked = cloneDeep(args);
  const regex = /\d(?=\d{4})/gm;
  argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');

  const inbound = new DumpBucket(null, 'registerAndSubscribe', {
    location: {
      message: 'Inbound Funnel Order',
      const: 'users.ts > registerAndSubscribe()',
    },
    args: argsMasked,
  });
  await session.store(inbound);
  await session.saveChanges();
  session.advanced.evict(inbound);

  const {
    values: { user, address, card },
  } = args;
  const requestedOnboardingCall = args.requestedOnboardingCall ? args.requestedOnboardingCall : false;

  let customer = await session
    .query<User>({ indexName: 'Users' })
    .whereEquals('email', user.email)
    .firstOrNull();

  if (args.values.interests) {
    updateMailChimpUser(session, args.values.user.email, 'eebfcc06d2', args.values.interests, true);
  }

  try {
    const product = await session.load<Product>('products/705-A'); // TVI Pro 3 Month Membership
    session.advanced.evict(product);

    if (customer && customer.active) {
      // TODO User already exists and is active
      // TODO Do we upgrade them or what is going on?\
      throw new Error('You already have an account.');
    } else if (!customer) {
      let username = `${user.firstName.trim()}${user.lastName.trim()}`.replace(/\s/g, '').toLowerCase();
      username = await Utils.getValidUsername(session, username);
      // create the user
      customer = new User(
        Utils.getShortUuid(),
        Utils.capitalizeEachFirstLetter(user.firstName),
        Utils.capitalizeEachFirstLetter(user.lastName),
        username,
        user.email.trim().toLowerCase(),
        user.password,
        false,
        [],
        [],
        null,
        true,
        user.phone.trim(),
        [...product.roles],
        [],
        null,
        address
      );
      await session.store(customer);
      await session.saveChanges();

      if (requestedOnboardingCall) {
        sendSESOnboardingMail(user, INFO_TRIPVALETINCENTIVES, 'support@tripvalet.com', product.displayName, 'OnBoardTemplate');
      }
    } else {
      customer.address = address;
      customer.phone = user.phone.trim();
      customer.roles = uniq(customer.roles ? customer.roles.concat(product.roles) : [...product.roles]);
      await session.saveChanges();
    }

    const stripeToken = await createToken(card, customer.address, customer, paymentAccountKey);
    if (!stripeToken.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }
    const stripeCustomer = await createCustomer(
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      product.amount,
      stripeToken.payload.id,
      paymentAccountKey
    );
    if (!stripeCustomer.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeCustomer.exception));
      await session.saveChanges();
      throw new Error(stripeCustomer.exception.errorMessage);
    } else if (stripeCustomer.success && stripeCustomer.exception) {
      await Utils.sendException(stripeCustomer.exception, true);
    }

    const stripeCharge = await createCharge(
      stripeCustomer.payload,
      new SaleInfo(
        customer.email,
        customer.firstName,
        customer.lastName,
        card.number,
        card.month,
        card.year,
        card.cvc,
        3995, // Setup fee
        customer.uuid
      ),
      stripeToken.payload.card.id,
      'TripValet Incentives Pro Edition Setup Fee',
      paymentAccountKey
    );
    if (!stripeCharge.success) {
      customer.active = false;
      customer.updatedAt = Utils.getNowUtc();
      await session.store(await Utils.sendException(stripeCharge.exception));
      await session.saveChanges();
      throw new Error(stripeCharge.exception.errorMessage);
    }

    customer.active = true;
    customer.updatedAt = Utils.getNowUtc();
    customer.stripe = new StripeData(stripeCustomer.payload.id, null, product.product.id, null, null, paymentAccountKey);

    await session.saveChanges();
    // New enrollment AXIOS post
    await axios
      .post('https://tripvalet.membertek.com/external-api/new-enrollment', { ID: customer.id, Email: customer.email })
      .then(() => {
        // console.log(response);
      })
      .catch(() => {
        // console.log(error);
      });
    // Add to Mailchimp list
    const mergeFields = {
      email: customer.email,
      firstName: customer.firstName,
      lastName: customer.lastName,
      phone: customer.phone,
    };
    await addToMailChimpWhenSubscribed(session, mergeFields, MAILCHIMPLIST_ID);
    // send emails
    await Utils.sendTripValetWelcome(customer, user.password, session);
    if (
      some(product.roles, (role: string) => {
        return role.startsWith('TVI');
      })
    ) {
      await Utils.sendTripValetIncentivesWelcome(customer, user.password, session);
    }
    return { success: true, nextFunnelStepUrl: 'https://incentives.tripvalet.com/' };
  } catch (ex) {
    const argsMasked = args;
    const regex = /\d(?=\d{4})/gm;
    argsMasked.values.card.number = argsMasked.values.card.number.replace(regex, '*');
    await session.store(await Utils.createAndSendException(null, null, new Error(ex.message).stack, { errorMessage: ex.message, user, argsMasked }));
    await session.saveChanges();
    throw ex;
  }
};

export const generateAffiliateLinks = async (userId: string, session: IDocumentSession): Promise<Links[]> => {
  try {
    const result: Links[] = [];
    const funnels: Funnel[] = await session
      .query<Funnel>({ indexName: 'Funnels' })
      .whereEquals('hidden', false)
      .orderBy('createdAt')
      .all();
    const user: User = await session.load<User>(userId);

    funnels.map(funnel => {
      for (const step of funnel.funnelSteps) {
        if (step.url[0] === '/') {
          result.push({
            url: `https://${user.username.toLowerCase()}.${funnel.domain.tld.toLowerCase()}${step.url.toLowerCase()}`,
            title: funnel.title,
          });
        } else {
          result.push({
            url: `https://${user.username.toLowerCase()}.${funnel.domain.tld.toLowerCase()}/${step.url.toLowerCase()}`,
            title: funnel.title,
          });
        }
        break;
      }
    });
    return result;
  } catch (ex) {
    // console.log(ex);
  }
};

export const getAncestorsWithCollection = (ancestors: string): string => {
  const userIds: string[] = [];
  ancestors.split(',').forEach(id => {
    userIds.push(`users/${id}`);
  });
  return userIds.join(',');
};

export const getAncestorsAsArray = (ancestors: string): string[] => {
  return getAncestorsWithCollection(ancestors).split(',');
};

export const getAncestorLevelsUp = (ancestors: string): string[] => {
  if (!ancestors) return [];
  const ancestorArray = getAncestorsAsArray(ancestors);
  return reverse(ancestorArray);
};

const sendSESMail = (sendMail: string, receiveMail: string, templateName: string, message: { memberFirstName: any; affiliateName: string; uuid: any }) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  const ses = new AWS.SES({ apiVersion: '2010-12-01' });
  const params = {
    Source: sendMail,
    Template: templateName,
    Destination: {
      ToAddresses: [receiveMail],
    },
    TemplateData: JSON.stringify(message),
  };

  ses.sendTemplatedEmail(params, async (err: any) => {
    if (err) {
      // console.log('Error sending mail:', err);
    } else {
    }
  });
};

const sendSESOnboardingMail = (user: UserWithPassword, sendMail: string, receiveMail: string, productName: string, templateName: string) => {
  AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
  });
  const ses = new AWS.SES({ apiVersion: '2010-12-01' });
  const data = {
    memeberFirstName: user.firstName,
    memberName: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    product: productName,
    gravatarUrl: gravatar.url(user.email, { s: '80', d: 'mp' }, false),
    // uuid:user.uuid
  };
  const templateData = JSON.stringify(data);
  const params = {
    Source: sendMail,
    Template: templateName,
    Destination: {
      ToAddresses: [receiveMail],
    },
    TemplateData: templateData,
  };

  ses.sendTemplatedEmail(params, async (err: any) => {
    if (err) {
      // console.log('Error sending mail:', err);
    } else {
    }
  });
};

export const getUser = async (session: IDocumentSession, sessionUser: ICookieSession, args: { userId: string }): Promise<User> => {
  if (process.env.NODE_ENV === 'development') {
    return session.load<User>(sessionUser ? sessionUser.id : args.userId ? args.userId : '');
  } else {
    return session.load<User>(sessionUser.id);
  }
};

export const getIdWithoutCollection = (id: string): string => {
  return id.slice(id.indexOf('/') + 1);
};

export const appendUserIdToAncestors = (id: string, ancestors: string): string => {
  if (!id) return ancestors;
  if (!ancestors || ancestors === 'undefined') return getIdWithoutCollection(id);
  return `${ancestors},${id.slice(id.indexOf('/') + 1)}`;
};

// export const getAncestorsWithCollection = (ancestors: string): string => {
//   const userIds: string[] = [];
//   ancestors.split(',').forEach(id => {
//     userIds.push(`users/${id}`);
//   });
//   return userIds.join(',');
// }

// export const getAncestorsAsArray = (ancestors: string): string[] => {
//   return getAncestorsWithCollection(ancestors).split(',');
// }

// export const getAncestorLevelsUp(ancestors: string): string[] {
//   if (!ancestors) return [];
//   const ancestorArray = getAncestorsAsArray(ancestors);
//   return reverse(ancestorArray);
// }

export const getDepthFromAncestors = (ancestors: string): number => {
  return ancestors.split(',').length + 1;
};

// export const getProductFromUserRoles = (userRoles: string[], rolesToLookFor: string[]): string  => {
//   const roleFound = filter(userRoles, role => {
//     return some(rolesToLookFor, role);
//   });
//   return roleFound;
// }
