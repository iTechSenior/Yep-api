import {
  Context,
  SaleInfo,
  StripeChargeReference,
  StripeCustomerReference,
  StripeSourceReference,
  StripeCustomerInvoiceReference,
  Card,
} from '@/helpers/interfaces';
import {
  Roles,
  verifyAccess,
  formatSearchTerm,
  createAndSendException,
  getNowUtc,
  sendLasVegasReservationOnlyReceipt,
  sendException,
  getIp,
  sendLasVegasActivationAndReservationReceipt,
  sendLasVegasActivationOnlyReceipt,
  sendOdenzaCertificateReceipt,
  getShortUuid,
} from '@/helpers/utils';
import { filter, uniq, find } from 'lodash';
import { Query, Args, Ctx, Resolver, Arg, Mutation } from 'type-graphql';
import {
  Certificate,
  GetCertificates,
  GetCertificatesForProspect,
  GetDocuments,
  UploadMexicoCertsInput,
  CertificateInput,
  PersonalizedCertificateInput,
} from '@/types/certificate';
import { DateTime } from 'luxon';
import { LasVegasCertificatePayment } from '@/types/prospect/LasVegasCertificatePayment';
import { NextIdentityForCommand } from 'ravendb';
import { UserReference, User } from '@/types/user';
import moment = require('moment');
import * as Stripe from 'stripe';
import * as fs from 'fs';
import * as path from 'path';
import { BooleanResponse } from '@/types/common/BooleanResponse';
import { CommissionRevenueShare, Commission } from '@/types/commission';
import { AuthorizeCaptureResult } from '@/types/prospect/AuthorizeCaptureResult';
import { Prospect, Visit, LasVegasCertificatePaymentInput } from '@/types/prospect';
import { DeliveryMethod, PaymentAccountEnum } from '@/types/Enums';
import { Order, OrderReference } from '@/types/order';
import { ProspectReference } from '@/types/prospect/ProspectReference';
// import { createWriteStream } from 'fs';
import stream = require('stream');
import { createToken, createCustomer, createCharge, getNextDayOfWeek } from '@/helpers/stripe';
import { OdenzaActivationPayment } from '@/types/prospect/OdenzaActivationPayment';
import { CertificateRedemptionCode } from '@/types/certificateRedemptionCode';
import { initializeStore } from '@/db/index';
import { OdenzaActivationPaymentInput } from '@/types/prospect/OdenzaActivationPaymentInput';
import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import * as certs from '@/helpers/certificates';
import shortid = require('shortid');
import { CertificateForMobile } from '@/types/certificate/CertificateForMobile';
const express = require('express');
const SVGtoPDF = require('svg-to-pdfkit');
const router = express.Router();
// tslint:disable-next-line: variable-name
const node_xj = require('xls-to-json');

const COMMISSION_FEE = 6;
const MEXICO_AMOUNT = 39.95;

const storeUpload = (stream: any, filename: string) =>
  new Promise((resolve, reject) =>
    stream
      .pipe(fs.createWriteStream(filename))
      .on('finish', () => resolve())
      .on('error', reject)
  );

const CertificateIdTranslation = {
  '1-A': 'certificate1A',
  '3-A': 'certificate3A',
  '4-A': 'certificate4A',
  '5-A': 'certificate5A',
  '6-A': 'certificate6A',
  '34-A': 'certificate34A',
  '35-A': 'certificate35A',
  '36-A': 'certificate36A',
  '37-A': 'certificate37A',
  '38-A': 'certificate38A',
  '39-A': 'certificate39A',
  '40-A': 'certificate40A',
};
@Resolver(() => Certificate)
export class CertificateResolver {
  @Query(() => [Certificate])
  async getCertificates(
    @Args() { skip, pageSize, membershipLevel }: GetCertificates,
    @Ctx()
    { session, req }: Context
  ): Promise<Certificate[]> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    return session
      .query<Certificate>({ collection: 'Certificates' })
      .skip(skip ? skip : 0)
      .take(pageSize ? pageSize : 25)
      .whereIn('membershipLevel', membershipLevel ? [membershipLevel] : ['TVI PLUS', 'TVI PRO'])
      .andAlso()
      .whereEquals('active', true)
      .orderByDescending('displayOrder', 'Double')
      .all();
  }

  @Query(() => [CertificateForMobile])
  async getCertificatesForMobile(
    @Ctx()
    { session }: Context
  ): Promise<CertificateForMobile[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);

    const certs = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .orderByDescending('displayOrder', 'Double')
      .all();

    return certs.map(cert => CertificateForMobile.fromCertificate(cert));
  }

  @Query(() => [Certificate])
  async getCertificatesForProspect(
    @Args() { searchTerm }: GetCertificatesForProspect,
    @Ctx()
    { session, req }: Context
  ): Promise<Certificate[]> {
    const certificates = session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true);
    if (searchTerm) {
      certificates.search('title', `*${searchTerm}*`);
    }
    return certificates.orderBy('displayOrder', 'Double').all();
  }

  @Query(() => [Certificate])
  async getCertificateDocuments(@Args() { type }: GetDocuments, @Ctx() { session, req }: Context): Promise<Certificate[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const certificates: Certificate[] = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .andAlso()
      .whereEquals('documents.type', type)
      .orderBy('displayOrder', 'Double')
      .all();
    const documents = certificates.map(cert => {
      if (type) {
        cert.documents = filter(cert.documents, { active: true, type: type });
        // console.log('cert.documents', JSON.stringify(cert.documents));
        return cert;
      } else return cert;
    });
    // console.log('documents', documents);
    return documents;
  }

  @Mutation(() => Certificate)
  async addCertificate(@Arg('args') args: CertificateInput, @Ctx() { session, req }: Context): Promise<Certificate> {
    const { title, description, imageUrl, membershipLevel, apiAccessToken, active, defaultMessage, displayOrder, images } = args;
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const certificate: Certificate = new Certificate(
      null,
      title,
      description,
      imageUrl,
      membershipLevel,
      apiAccessToken,
      active,
      defaultMessage,
      displayOrder,
      images
    );
    await session.store(certificate);
    await session.saveChanges();
    return certificate;
  }

  @Mutation(() => Certificate)
  async editCertificate(@Arg('args') args: CertificateInput, @Ctx() { session, req }: Context): Promise<Certificate> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const certificate = await session.load<Certificate>(args.id);
    if (!certificate) {
      return null;
    }
    Object.assign(certificate, { ...Certificate.fromCertificate(args) });
    await session.saveChanges();
    return certificate;
  }

  @Mutation(() => AuthorizeCaptureResult)
  async captureVegasCertificate(@Arg('args') args: LasVegasCertificatePaymentInput, @Ctx() { session, req, store }: Context): Promise<AuthorizeCaptureResult> {
    // console.log('entered');
    const { card, address } = args;
    // tslint:disable-next-line:prefer-const
    let customer: User = new User(getShortUuid(), '', '', '', '', '', true, [], [], '', false, '', [], [], null, null, null, false, false);
    customer.firstName = args.firstName;
    customer.lastName = args.lastName;
    customer.email = args.deliveryEndpoint;
    customer.phone = args.phone;
    let paymentAmount: number = 0;
    if (args.payActivation) {
      paymentAmount += 17.95;
    }
    if (args.payReservation) {
      paymentAmount += 99;
    }
    const nextIdentityCommand = new NextIdentityForCommand('TV-LVC');
    await store.getRequestExecutor().execute(nextIdentityCommand);
    const invoiceNumber = `TV-LVC-${nextIdentityCommand.result.toString().padStart(10, '0')}`;
    const paymentAccountKey = PaymentAccountEnum.TripValetIncentives;
    const stripeToken = await createToken(card, address, customer, paymentAccountKey);
    if (!stripeToken.success) {
      await session.store(await sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }
    const stripeCustomer = await createCustomer(
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      paymentAmount,
      stripeToken.payload.id,
      paymentAccountKey
    );
    if (!stripeCustomer.success) {
      await session.store(await sendException(stripeCustomer.exception));
      await session.saveChanges();
      throw new Error(stripeCustomer.exception.errorMessage);
    } else if (stripeCustomer.success && stripeCustomer.exception) {
      await sendException(stripeCustomer.exception, true);
    }
    const stripeCharge = await createCharge(
      stripeCustomer.payload,
      new SaleInfo(customer.email, customer.firstName, customer.lastName, card.number, card.month, card.year, card.cvc, paymentAmount * 100, invoiceNumber),
      stripeToken.payload.card.id,
      'Las Vegas Certificate Fees',
      paymentAccountKey
    );
    if (!stripeCharge.success) {
      await session.store(await sendException(stripeCharge.exception));
      await session.saveChanges();
      throw new Error(stripeCharge.exception.errorMessage);
    } else {
      let prospect: Prospect = await session
        .query<Prospect>({ collection: 'Prospects' })
        .whereEquals('uuid', args.uuid)
        .firstOrNull();
      prospect.visits.push(new Visit(new Date(), getIp(req), req.url));
      // tslint:disable-next-line:prefer-object-spread
      prospect = Object.assign(prospect, {
        firstName: args.firstName,
        lastName: args.lastName,
        deliveryEndpoint: args.deliveryEndpoint,
        deliveryMethod: DeliveryMethod.Email,
        phone: args.phone,
        redeemed: true,
        updatedAt: getNowUtc(),
      });
      prospect.travelers = args.travelers;
      prospect.preferredDates = args.preferredDates;
      prospect.alternateDates = args.alternateDates;
      await session.saveChanges();
      try {
        const certificate = await session.load<Certificate>(prospect.certificate.id);
        if (args.payActivation) {
          if (args.payReservation) {
            sendLasVegasActivationAndReservationReceipt(prospect, customer, invoiceNumber, stripeCharge.payload);
          } else {
            sendLasVegasActivationOnlyReceipt(prospect, customer, invoiceNumber, stripeCharge.payload);
          }
        } else {
          sendLasVegasReservationOnlyReceipt(prospect, customer, invoiceNumber, stripeCharge.payload);
        }
      } catch (ex) {
        await session.store(await createAndSendException(prospect.id, new Error(ex.message).stack, ex.message, prospect));
        await session.saveChanges();
      }
      // Create Order
      let order: Order = null;
      const customerReference: UserReference = new UserReference(customer.id, customer.email, customer.firstName, customer.lastName);
      const affiliate: User = await session.load<User>(prospect.userId);
      const affiliateReference: UserReference = new UserReference(affiliate.id, affiliate.email, affiliate.firstName, affiliate.lastName);
      const lasVegasCharge = stripeCharge.payload;
      const chargeReference = new StripeChargeReference(
        lasVegasCharge.id,
        lasVegasCharge.amount,
        moment.unix(lasVegasCharge.created).toDate(),
        new StripeCustomerReference(stripeCustomer.payload.id, stripeCustomer.payload.email),
        lasVegasCharge.description,
        lasVegasCharge.paid,
        new StripeSourceReference(
          lasVegasCharge.source.id,
          (<Stripe.cards.ICard>lasVegasCharge.source).brand,
          (<Stripe.cards.ICard>lasVegasCharge.source).country,
          (<Stripe.cards.ICard>lasVegasCharge.source).last4,
          (<Stripe.cards.ICard>lasVegasCharge.source).exp_month,
          (<Stripe.cards.ICard>lasVegasCharge.source).exp_year
        ),
        lasVegasCharge.status
      );
      order = new Order(
        null,
        null,
        null,
        paymentAmount,
        customerReference,
        affiliateReference,
        {
          id: 'domains/1-A',
          tld: 'mytripvalet.com',
        },
        chargeReference,
        null,
        []
      );
      order.isRevenueShare = false;
      await session.store(order);
      // Create commission
      const orderReference: OrderReference = new OrderReference(order.id, order.products, order.totalAmount);
      const commission: Commission = new Commission(
        DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate(), // Friday Day Of Week
        COMMISSION_FEE,
        'Pending',
        customerReference,
        affiliateReference,
        new StripeCustomerInvoiceReference(null, stripeCustomer.payload.id, stripeCharge.payload.id, stripeCharge.payload.invoice as string, null),
        orderReference,
        null,
        new CommissionRevenueShare(false, null)
      );
      commission.createdAt = DateTime.fromMillis(new Date().getTime()).toJSDate(); // Friday Day Of Week
      commission.updatedAt = moment().toDate();
      await session.store(commission);
      await session.saveChanges();
      return { transId: stripeCharge.payload.id, authCode: stripeCharge.payload.receipt_number, message: '' };
    }
  }

  @Mutation(() => AuthorizeCaptureResult)
  async captureOdenzaActivation(@Arg('args') args: OdenzaActivationPaymentInput, @Ctx() { session, store, req }: Context): Promise<AuthorizeCaptureResult> {
    // console.log('entered');
    const { card, address } = args;
    // tslint:disable-next-line:prefer-const
    let customer = new User(getShortUuid(), '', '', '', '', '', true, [], [], '', false, '', [], [], null, null, null, false, false);
    customer.firstName = args.firstName;
    customer.lastName = args.lastName;
    customer.email = args.deliveryEndpoint;
    customer.phone = args.phone;
    let paymentAmount: number = 0;
    if (args.payActivation) {
      paymentAmount += args.payAmount;
    }
    let invoiceNumber = '';
    if (args.cert === 'certificates/39-A') {
      const nextIdentityCommand = new NextIdentityForCommand('TV-OSSC');
      await store.getRequestExecutor().execute(nextIdentityCommand);
      invoiceNumber = `TV-OSSC-${nextIdentityCommand.result.toString().padStart(10, '0')}`;
    } else {
      const nextIdentityCommand = new NextIdentityForCommand('TV-O2NF2');
      await store.getRequestExecutor().execute(nextIdentityCommand);
      invoiceNumber = `TV-O2NF2-${nextIdentityCommand.result.toString().padStart(10, '0')}`;
    }
    const paymentAccountKey = PaymentAccountEnum.TripValetIncentives;
    const stripeToken = await createToken(card, address, customer, paymentAccountKey);
    if (!stripeToken.success) {
      await session.store(await sendException(stripeToken.exception));
      await session.saveChanges();
      throw new Error(stripeToken.exception.errorMessage);
    }
    const stripeCustomer = await createCustomer(
      customer.email,
      customer.firstName,
      customer.lastName,
      customer.phone,
      paymentAmount,
      stripeToken.payload.id,
      paymentAccountKey
    );
    if (!stripeCustomer.success) {
      await session.store(await sendException(stripeCustomer.exception));
      await session.saveChanges();
      throw new Error(stripeCustomer.exception.errorMessage);
    } else if (stripeCustomer.success && stripeCustomer.exception) {
      await sendException(stripeCustomer.exception, true);
    }

    let chargeDescription = 'Certificate Activation Fee';
    switch (args.cert) {
      case 'certificates/40-A':
        chargeDescription = '2 Night Hotel Getaway For 2 Activation Fee';
        break;
      case 'certificates/39-A':
        chargeDescription = '2 Night Sunscape All-Inclusive Activation Fee';
        break;
      case 'certificates/41-A':
        chargeDescription = '8 Day - 7 Night 3500 Locations Activation Fee';
        break;
      case 'certificates/42-A':
        chargeDescription = '3 Day - 2 Night Family Fun Vacation Activation Fee';
        break;
      default:
        break;
    }

    const stripeCharge = await createCharge(
      stripeCustomer.payload,
      new SaleInfo(customer.email, customer.firstName, customer.lastName, card.number, card.month, card.year, card.cvc, paymentAmount * 100, invoiceNumber),
      stripeToken.payload.card.id,
      chargeDescription,
      paymentAccountKey
    );
    if (!stripeCharge.success) {
      await session.store(await sendException(stripeCharge.exception));
      await session.saveChanges();
      throw new Error(stripeCharge.exception.errorMessage);
    } else {
      let prospect = await session
        .query<Prospect>({ collection: 'Prospects' })
        .whereEquals('uuid', args.uuid)
        .firstOrNull();
      prospect.visits.push(new Visit(new Date(), getIp(req), req.url));
      // tslint:disable-next-line:prefer-object-spread
      prospect = Object.assign(prospect, {
        firstName: args.firstName,
        lastName: args.lastName,
        deliveryEndpoint: args.deliveryEndpoint,
        deliveryMethod: DeliveryMethod.Email,
        phone: args.phone,
        redeemed: true,
        updatedAt: getNowUtc(),
      });
      await session.saveChanges();
      try {
        // sendNightSunscapeActivationReservationMail(prospect, customer, invoiceNumber, stripeCharge.payload, args.payActivation, args.cert);
        const redemption = await session
          .query<CertificateRedemptionCode>({ collection: 'CertificateRedemptionCodes' })
          .take(1)
          .whereEquals('redeemed', false)
          .andAlso()
          .whereEquals('certificateId', args.cert)
          .orderBy('numericCode')
          .all();
        const certRedemptionCode = redemption[0];
        const redemptionCode = certRedemptionCode.fullRedemptionCode;
        const transaction = stripeCharge.payload;
        const source = transaction.source as Card;
        const receiptInfo = {
          invoiceNumber,
          transId: transaction.id,
          authCode: transaction.receipt_number,
          cardType: source.brand,
          cardNumber: source.last4,
          activationFee: paymentAmount,
        };

        await sendOdenzaCertificateReceipt(prospect, customer, receiptInfo, redemptionCode);
        certRedemptionCode.redeemed = true;
        certRedemptionCode.prospect = new ProspectReference(
          prospect.id,
          prospect.firstName,
          prospect.lastName,
          prospect.deliveryEndpoint,
          prospect.deliveryMethod
        );
        const user = await session.load<User>(prospect.userId);
        certRedemptionCode.user = new UserReference(user.id, user.email, user.firstName, user.lastName);
        await session.saveChanges();
      } catch (ex) {
        // console.log(ex.message);
        await session.store(await createAndSendException(prospect.id, new Error(ex.message).stack, ex.message, prospect));
        await session.saveChanges();
      }
      // Create Order
      let order: Order = null;
      const customerReference = new UserReference(customer.id, customer.email, customer.firstName, customer.lastName);
      const affiliate = await session.load<User>(prospect.userId);
      const affiliateReference = new UserReference(affiliate.id, affiliate.email, affiliate.firstName, affiliate.lastName);
      const charge = stripeCharge.payload;
      const chargeReference = new StripeChargeReference(
        charge.id,
        charge.amount,
        moment.unix(charge.created).toDate(),
        new StripeCustomerReference(stripeCustomer.payload.id, stripeCustomer.payload.email),
        charge.description,
        charge.paid,
        new StripeSourceReference(
          charge.source.id,
          (<Stripe.cards.ICard>charge.source).brand,
          (<Stripe.cards.ICard>charge.source).country,
          (<Stripe.cards.ICard>charge.source).last4,
          (<Stripe.cards.ICard>charge.source).exp_month,
          (<Stripe.cards.ICard>charge.source).exp_year
        ),
        charge.status
      );
      order = new Order(
        null,
        null,
        null,
        paymentAmount,
        customerReference,
        affiliateReference,
        {
          id: 'domains/1-A',
          tld: 'mytripvalet.com',
        },
        chargeReference,
        null,
        []
      );
      order.isRevenueShare = false;
      await session.store(order);
      // Create commission
      const orderReference = new OrderReference(order.id, order.products, order.totalAmount);
      const commission = new Commission(
        DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate(), // Friday Day Of Week
        3,
        'Pending',
        customerReference,
        affiliateReference,
        new StripeCustomerInvoiceReference(null, stripeCustomer.payload.id, stripeCharge.payload.id, stripeCharge.payload.invoice as string, null),
        orderReference,
        null,
        new CommissionRevenueShare(false, null)
      );
      commission.createdAt = DateTime.fromMillis(new Date().getTime()).toJSDate();
      commission.updatedAt = moment().toDate();
      await session.store(commission);
      await session.saveChanges();
      return { transId: stripeCharge.payload.id, authCode: stripeCharge.payload.receipt_number, message: '' };
    }
  }

  @Mutation(() => BooleanResponse)
  async uploadMexicoCerts(@Arg('args') args: UploadMexicoCertsInput, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const { createReadStream, filename } = await args.file;
    const filePath: string = path.resolve(`./src/${filename}`);
    const store = await initializeStore();
    const stream = createReadStream();
    await storeUpload(stream, filePath);
    const getLocationsFromExcel = (sheet: string, filename: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        node_xj(
          {
            input: filePath,
            output: null,
            sheet: sheet,
          },
          async (err: Error, result: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    };
    const emailsFromExcel = await getLocationsFromExcel('Sheet1', filePath);
    const emails = uniq(emailsFromExcel.reduce((prev, current) => prev.concat(current['Email']), new Array<string>()));
    const customers: Prospect[] = await session
      .query<Prospect>({ collection: 'Prospects' })
      .whereIn('deliveryEndpoint', emails)
      .whereEquals('deliveryMethod', 'Email')
      .whereEquals('certificate.id', 'certificates/35-A')
      .all();
    const userIds = uniq(customers.reduce((prev, current) => prev.concat(current['userId']), new Array<string>()));
    const users: User[] = await session
      .query<User>({ indexName: 'Users' })
      .whereIn('id', userIds)
      .all();
    if (customers.length === 0 || users.length === 0) {
      return { success: false };
    }
    const orders = [];
    const commissions = [];
    let order: Order = null;
    for (const customer of customers) {
      // Create Order
      const affiliate: User = find<User>(users, user => user.id === customer.userId);
      const customerReference = new UserReference(customer.id, customer.deliveryEndpoint, customer.firstName, customer.lastName);
      const affiliateReference = new UserReference(affiliate.id, affiliate.email, affiliate.firstName, affiliate.lastName);
      order = new Order(
        null,
        null,
        null,
        MEXICO_AMOUNT,
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
      orders.push(order);
      // Create commission
      const commission = new Commission(
        DateTime.fromJSDate(getNextDayOfWeek(moment().toDate(), 5, 0)).toJSDate(), // Friday Day Of Week
        COMMISSION_FEE,
        'Pending',
        customerReference,
        affiliateReference,
        null,
        new OrderReference(order.id, order.products, order.totalAmount),
        null,
        new CommissionRevenueShare(false, null)
      );
      commission.createdAt = DateTime.fromMillis(new Date().getTime()).toJSDate();
      commission.updatedAt = moment().toDate();
      commissions.push(commission);
    }
    const tryBulkUpdate = store.bulkInsert();
    for (const order of orders) {
      await tryBulkUpdate.store(order, order.id);
    }
    for (const commission of commissions) {
      await tryBulkUpdate.store(commission, commission.id);
    }
    await tryBulkUpdate.finish();
    // Delete the csv file
    fs.unlink(filePath, (err: Error) => {
      if (err) {
        console.error(err);
      }
    });
    return { success: true };
  }

  // @Mutation()
  // async getPersonalizedCertificate(@Arg('args') args: PersonalizedCertificateInput, @Ctx(){session, req}: Context) {
  //   const doc = new PDFDocument();
  //   res.statusCode = 200;
  //   res.setHeader('Content-type', 'application/pdf');
  //   res.setHeader('Access-Control-Allow-Origin', '*');
  //   res.setHeader('Content-disposition', 'attachment; filename=Untitled.pdf');

  //   const id: string = req.params.id;
  //   console.log(req.params.id, CertificateIdTranslation['1-A']);
  //   const certificate = certs.certificate1A;
  //   console.log(certificate.certificateId);
  //   doc.image(certificate.base64, -2, 0, { fit: [640, 791] });

  //   SVGtoPDF(doc, certificate.svg, 25, 590, { width: 390, preserveAspectRatio: 'xMinYMin meet' });
  //   doc
  //     //.text(`Referral Code: ${req.user.userName}`, 25, 740, {
  //     .text(`Referral Code: test`, 25, 740, {
  //       height: 10,
  //     })

  //     .text(`Certificate Code: ${req.params.id}`, 25, 760, {
  //       height: 10,
  //     })

  //     .text(`Go Redeem: http://redeem.tripvalet.com`, 25, 705, {
  //       height: 10,
  //     });

  //   doc.pipe(res);
  //   doc.end();
  // });
}
