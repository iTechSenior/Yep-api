import * as express from 'express';
import { IDocumentSession, IDocumentStore } from 'ravendb';
import { JwtUser } from '@/types/JwtUser';
import { User } from '@/types/user';
import { Address } from '@/types/address';
import * as Stripe from 'stripe';
import { Exception } from '@/types/exception';

export interface CustomRequest extends express.Request {
  // userSession: {
  //   user: ICookieSession;
  //   nowInMinutes: number;
  // };
  db: IDocumentStore;
  user?: JwtUser;
}

export interface ICookieSession {
  id?: string;
  email?: string;
  roles?: string[];
  token: string;
}

export interface Context {
  store: IDocumentStore;
  session: IDocumentSession;
  req: CustomRequest;
  res: express.Response;
  users?: User;
}

export interface IWebhook {
  webhook: any;
}

export class Webhook implements IWebhook {
  constructor(public webhook: any) {}
}

// tslint:disable-next-line: no-empty-interface
export interface Metadata {}

export interface Card {
  id: string;
  object: string;
  address_city?: any;
  address_country?: any;
  address_line1?: any;
  address_line1_check?: any;
  address_line2?: any;
  address_state?: any;
  address_zip?: any;
  address_zip_check?: any;
  brand: string;
  country: string;
  cvc_check?: any;
  dynamic_last4?: any;
  exp_month: number;
  exp_year: number;
  fingerprint: string;
  funding: string;
  last4: string;
  metadata: Metadata;
  name?: any;
  tokenization_method?: any;
}

export interface Token {
  id: string;
  object: string;
  card: Card;
  client_ip?: any;
  created: number;
  livemode: boolean;
  type: string;
  used: boolean;
}

export interface Customer {
  id: string;
  object: string;
  account_balance: number;
  created: number;
  currency: string;
  default_source?: any;
  delinquent: boolean;
  description?: any;
  discount?: any;
  email?: any;
  invoice_prefix: string;
  livemode: boolean;
  metadata: Metadata;
  shipping?: any;
  sources: Source[];
  subscriptions: Subscription[];
}

export interface AchCreditTransfer {
  account_number: string;
  routing_number: string;
  fingerprint: string;
  bank_name: string;
  swift_code: string;
}

export interface Owner {
  address?: any;
  email: string;
  name?: any;
  phone?: any;
  verified_address?: any;
  verified_email?: any;
  verified_name?: any;
  verified_phone?: any;
}

export interface Receiver {
  address: string;
  amount_charged: number;
  amount_received: number;
  amount_returned: number;
  refund_attributes_method: string;
  refund_attributes_status: string;
}

export interface Source {
  id: string;
  object: string;
  ach_credit_transfer: AchCreditTransfer;
  amount?: any;
  client_secret: string;
  created: number;
  currency: string;
  flow: string;
  livemode: boolean;
  metadata: Metadata;
  owner: Owner;
  receiver: Receiver;
  statement_descriptor?: any;
  status: string;
  type: string;
  usage: string;
}

export interface Plan {
  id: string;
  object: string;
  active: boolean;
  aggregate_usage?: any;
  amount: number;
  billing_scheme: string;
  created: number;
  currency: string;
  interval: string;
  interval_count: number;
  livemode: boolean;
  metadata: PlanMetadata;
  nickname?: any;
  product: string;
  tiers?: any;
  tiers_mode?: any;
  transform_usage?: any;
  trial_period_days: number;
  usage_type: string;
}

export interface Datum {
  id: string;
  object: string;
  created: number;
  metadata: Metadata;
  plan: Plan;
  quantity: number;
  subscription: string;
}

export interface Items {
  object: string;
  data: Datum[];
  has_more: boolean;
  total_count: number;
  url: string;
}

export interface PlanMetadata {
  charset: string;
  content: string;
}

export interface Subscription {
  id: string;
  object: string;
  application_fee_percent?: any;
  billing: string;
  billing_cycle_anchor: number;
  cancel_at_period_end: boolean;
  canceled_at: number;
  created: number;
  current_period_end: number;
  current_period_start: number;
  customer: string;
  days_until_due?: any;
  discount?: any;
  ended_at: number;
  items: Items;
  livemode: boolean;
  metadata: Metadata;
  plan: Plan;
  quantity: number;
  start: number;
  status: string;
  tax_percent?: any;
  trial_end: number;
  trial_start: number;
}

export interface GraphQLArgs {
  customerId: string;
  subscriptionId: string;
  tokenId: string;
}
export interface ISaleInfo {
  email: string;
  firstNameOnCard: string;
  lastNameOnCard: string;
  card: string; // card number
  ccExpMonth: string;
  ccExpYear: string;
  chargeAmount: number;
  cvc: string;
  uuid: string;
}

export class SaleInfo implements ISaleInfo {
  constructor(
    public email: string,
    public firstNameOnCard: string,
    public lastNameOnCard: string,
    public card: string,
    public ccExpMonth: string,
    public ccExpYear: string,
    public cvc: string,
    public chargeAmount: number,
    public uuid: string
  ) {}
}

export interface IChargeCustomerResult {
  success: boolean;
  customerId: string;
  sourceId: string;
  chargeInfo: Stripe.charges.ICharge;
}

export interface IStripeChargeCustomerResult {
  success: boolean;
  payload?: IChargeCustomerResult;
  exception?: Exception;
}

export interface ISuccessExceptionBase {
  success: boolean;
  exception?: Exception;
}

export interface ICreateInvoiceItemResult extends ISuccessExceptionBase {
  payload?: Stripe.invoiceItems.InvoiceItem;
}

export interface ICreatePaymentMethodResult extends ISuccessExceptionBase {
  payload?: Stripe.paymentMethods.IPaymentMethod;
}

export interface ICreateSubscriptionResult extends ISuccessExceptionBase {
  payload?: Stripe.subscriptions.ISubscription;
}

export interface ICreateChargeResult extends ISuccessExceptionBase {
  payload?: Stripe.charges.ICharge;
}

export interface ICreateCustomerResult extends ISuccessExceptionBase {
  payload?: Stripe.customers.ICustomer;
}

// export interface ICreateSourceResult extends ISuccessExceptionBase {
//   payload?: Stripe.cards.ICard;
// }
export interface ICreateSourceResult extends ISuccessExceptionBase {
  payload?: Stripe.bankAccounts.IBankAccount;
}

export interface ISetDefaultSourceResult extends ISuccessExceptionBase {
  payload?: Stripe.customers.ICustomer;
}

export interface ICreateTokenResult extends ISuccessExceptionBase {
  payload?: Stripe.tokens.IToken;
}

export interface IGetPlansListResults extends ISuccessExceptionBase {
  payload?: Stripe.IList<Stripe.plans.IPlan>;
}

export interface IGetProductsListResult extends ISuccessExceptionBase {
  payload?: Stripe.IList<Stripe.products.IProduct>;
}

export interface IRetrievePlanResult extends ISuccessExceptionBase {
  payload?: Stripe.plans.IPlan;
}

export interface IRetrieveSubscriptionResult extends ISuccessExceptionBase {
  payload?: Stripe.subscriptions.ISubscription;
}

export interface IRetrieveProductResult extends ISuccessExceptionBase {
  payload?: Stripe.products.IProduct;
}

export interface IRetrieveCustomerResult extends ISuccessExceptionBase {
  payload?: Stripe.customers.ICustomer;
}

// import { IStripeCustomerReference, IStripePlanReference, IStripeProductReference } from "../../interfaces/stripe";
// import { IUserReference, IUserSubscription } from "../../interfaces/users";

export interface IStripeSourceReference {
  id: string;
  brand: string;
  country: string;
  last4: string;
  expMonth: number;
  expYear: number;
}
export class StripeSourceReference implements IStripeSourceReference {
  constructor(public id: string, public brand: string, public country: string, public last4: string, public expMonth: number, public expYear: number) {}
}

export interface IStripeChargeReference {
  id: string;
  amount: number;
  created: Date;
  customer: IStripeCustomerReference;
  description: string;
  paid: boolean;
  source: IStripeSourceReference;
  status: string;
}
export class StripeChargeReference implements IStripeChargeReference {
  constructor(
    public id: string,
    public amount: number,
    public created: Date,
    public customer: IStripeCustomerReference,
    public description: string,
    public paid: boolean,
    public source: IStripeSourceReference,
    public status: string
  ) {}
}

export interface IStripeSubscriptionReference {
  id: string;
  userSubscriptionId: string;
  start: Date;
  end: Date;
  plan: IStripePlanSummary;
}
export class StripeSubscriptionReference implements IStripeSubscriptionReference {
  constructor(public id: string, public start: Date, public end: Date, public plan: IStripePlanSummary, public userSubscriptionId: string) {}
}

export interface IStripePlanSummary {
  amount: number;
  id: string;
  product: string;
  interval: string;
  intervalCount: number;
  nickname: string;
}

export class StripePlanSummary implements IStripePlanSummary {
  constructor(
    public amount: number,
    public id: string,
    public product: string,
    public interval: string,
    public intervalCount: number,
    public nickname: string
  ) {}
}

export interface IStripePlanReference {
  id: string;
  nickname: string;
  interval: string;
  amount: number;
}

export class StripePlanReference implements IStripePlanSummary {
  constructor(
    public id: string,
    public nickname: string,
    public interval: string,
    public intervalCount: number,
    public amount: number,
    public product: string
  ) {}
}

export interface IStripeProductReference {
  id: string;
  name: string;
}
export class StripeProductReference implements IStripeProductReference {
  constructor(public id: string, public name: string) {}
}

export interface IStripeCustomerReference {
  id: string;
  email: string;
}
export class StripeCustomerReference implements IStripeCustomerReference {
  constructor(public id: string, public email: string) {}
}

export interface IStripeCustomerInvoiceReference {
  eventId: string;
  customerId: string;
  chargeId: string;
  invoiceId: string;
  subscription: IStripeSubscriptionReference;
}
export class StripeCustomerInvoiceReference implements IStripeCustomerInvoiceReference {
  constructor(
    public eventId: string,
    public customerId: string,
    public chargeId: string,
    public invoiceId: string,
    public subscription: IStripeSubscriptionReference
  ) {}
}

export interface IUpdateCreditCard {
  values: IUpdateCreditCardData;
}

export interface IUpdateCreditCardData {
  cardId: string;
  saleInfo: ISaleInfo;
  address: Address;
}

export interface ISorPerson {
  City: string;
  Country: string;
  FirstName: string;
  LastName: string;
  Phone: string;
  PostalCode: string;
  SecondaryPhone: string;
  State: string;
  StreetAddress: string;
}

export interface ISorMember {
  contractNumber: string;
  CurrentPointBalance: number;
  DateCreated: Date;
  Email: string;
  ExpirationDate: Date;
  MyUserSettings: any[];
  OtherID: string;
  PrimaryPerson: ISorPerson;
  Reason: string;
  Status: string;
  UserID: number;
  VacationClubId: number;
}

export interface ISorAccountResponse {
  UserId: number;
}

export interface ISorAccountReference {
  userId: number;
  contractNumber: string;
}

export interface ISorApiResponse {
  Account: ISorAccountResponse;
  ResultType: string;
  Message: string;
}

export interface IApiCredentials {
  username: string;
  password: string;
}

export interface ISorClub {
  clubId: number;
  apiCredentials?: IApiCredentials;
  loginUrl?: string;
  subscriberTypePrefix?: number;
  userAccountTypeId?: number;
}

export interface ISorClubs {
  TripValetPlus: ISorClub;
  TripValetVip: ISorClub;
  TripValetBoomerang: ISorClub;
  CiceroTravelPlus: ISorClub;
  CiceroTravelVip: ISorClub;
  CiceroTravelBoomerang: ISorClub;
}

export interface ISorSingleSignOnRequest {
  APIUsername: string;
  APIPassword: string;
  Email?: string;
  ContractNumber?: string;
}

export interface ISorSsoLoginResponse {
  success: boolean;
  token: string;
  message?: string;
}
