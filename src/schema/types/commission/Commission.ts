import { ObjectType, Field, ID, Float } from 'type-graphql';
import { UserReference } from '@/types/user';
import { TierLevel } from '../product/TierLevel';
import { CommissionRevenueShare } from './CommissionRevenueShare';
import { OrderReference } from '../order';
import moment = require('moment');
import { StripeCustomerInvoiceReference } from '@/types/stripe';

@ObjectType()
export class Commission {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => UserReference)
  customer: UserReference;

  @Field(() => UserReference)
  affiliate: UserReference;

  @Field(() => TierLevel)
  tier: TierLevel;

  @Field()
  payCommissionOn: Date;

  @Field()
  payoutMethod: string;

  @Field(() => Float)
  commissionAmount: number;

  @Field()
  status: 'Pending' | 'Paid' | 'Refunded';

  @Field(() => StripeCustomerInvoiceReference)
  invoice: StripeCustomerInvoiceReference;

  @Field(() => OrderReference)
  order: OrderReference;

  @Field(() => CommissionRevenueShare)
  revenueShare: CommissionRevenueShare;
  //
  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    payCommissionOn: Date = null,
    commissionAmount: number = 0,
    status: 'Pending' | 'Paid' | 'Refunded',
    customer: UserReference,
    affiliate: UserReference,
    invoice: StripeCustomerInvoiceReference,
    order: OrderReference,
    tier: TierLevel = null,
    revenueShare: CommissionRevenueShare = null,
    payoutMethod: string = ''
  ) {
    this.payCommissionOn = payCommissionOn;
    this.commissionAmount = commissionAmount;
    this.status = status;
    this.customer = customer;
    this.affiliate = affiliate;
    this.invoice = invoice;
    this.order = order;
    this.tier = tier;
    this.revenueShare = revenueShare;
    this.payoutMethod = payoutMethod;
    this.createdAt = moment().toDate();
    this.updatedAt = moment().toDate();
  }
}
