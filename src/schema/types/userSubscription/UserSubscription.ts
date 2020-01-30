import { Field, ID, ObjectType } from 'type-graphql';
import { UserReference } from '@/types/user';
import { UserCrypto } from '@/types/userCrypto';
import { StripeCustomerInvoiceReference, StripePlanReference, StripeProductReference, StripeCustomerReference } from '@/helpers/interfaces';
import { UserStripeSubscription } from './UserStripeSubscription';
import { getNowUtc } from '@/helpers/utils';

@ObjectType()
export class UserSubscription {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  type: 'Stripe' | 'Crypto';

  @Field()
  status: string;

  @Field({ nullable: true })
  isRevenueShare?: boolean;

  @Field(() => UserReference)
  user: UserReference;

  @Field(() => UserReference, { nullable: true })
  affiliate?: UserReference;

  @Field()
  start: Date;

  @Field()
  currentPeriodEnd: Date;

  @Field()
  currentPeriodStart: Date;

  @Field()
  subscriptionId: string;

  @Field(() => UserStripeSubscription, { nullable: true })
  stripe?: UserStripeSubscription;

  @Field(() => UserCrypto, { nullable: true })
  crypto?: UserCrypto;

  @Field({ nullable: true })
  referrerCode?: string;

  @Field()
  paymentAccountKey: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    type: 'Stripe' | 'Crypto',
    user: UserReference,
    subscriptionId: string,
    status: string,
    start: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    paymentAccountKey: string,
    stripe: UserStripeSubscription = null,
    affiliate: UserReference = null
  ) {
    this.type = type;
    this.user = user;
    this.subscriptionId = subscriptionId;
    this.status = status;
    this.start = start;
    this.currentPeriodStart = currentPeriodStart;
    this.currentPeriodEnd = currentPeriodEnd;
    this.paymentAccountKey = paymentAccountKey;
    this.stripe = stripe;
    this.affiliate = affiliate;
    this.createdAt = getNowUtc();
    this.updatedAt = getNowUtc();
  }
}
