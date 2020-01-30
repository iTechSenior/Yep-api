import { ObjectType, Field, ID, Int } from 'type-graphql';
import { UserReference } from '@/types/user';
import { FunnelReference } from '@/types/funnel';
import { ProductReference } from '@/types/product';
import { DomainReference } from '@/types/domain';
import { Commission } from '@/types/commission';
import { StripeChargeReference, StripeCustomerInvoiceReference } from '@/types/stripe';
import { filter } from 'lodash';

@ObjectType()
export class Order {
  static filterCommissions(order: Order, affiliateId: string) {
    const commissions = filter(order.commissions, commission => {
      return commission.affiliate.id === affiliateId;
    });
    let filteredOrder = new this(
      order.leadId,
      order.funnel,
      order.products,
      order.totalAmount,
      order.customer,
      order.affiliate,
      order.domain,
      order.payment,
      order.invoice,
      commissions
    );

    filteredOrder.id = order.id;
    filteredOrder.createdAt = order.createdAt;
    filteredOrder.updatedAt = order.updatedAt;
    filteredOrder.isRevenueShare = order.isRevenueShare;

    return filteredOrder;
  }
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  leadId?: string;

  @Field(() => UserReference)
  customer: UserReference;

  @Field(() => UserReference, { nullable: true })
  affiliate?: UserReference;

  @Field(() => FunnelReference, { nullable: true })
  funnel?: FunnelReference;

  @Field(() => [ProductReference])
  products: ProductReference[];

  @Field(() => StripeCustomerInvoiceReference)
  invoice: StripeCustomerInvoiceReference;

  @Field(() => DomainReference)
  domain: DomainReference;

  @Field(() => StripeChargeReference)
  payment: StripeChargeReference;

  @Field(() => [Commission])
  commissions: Commission[];

  @Field(() => Int)
  totalAmount: number;

  @Field({ nullable: true })
  isRevenueShare?: boolean;

  @Field({ nullable: true })
  requestedOnboardingCall?: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    leadId: string = '',
    funnel: FunnelReference = null,
    products: ProductReference[] = null,
    totalAmount: number = 0,
    customer: UserReference = null,
    affiliate: UserReference = null,
    domain: DomainReference,
    payment: StripeChargeReference = null,
    invoice: StripeCustomerInvoiceReference = null,
    commissions: Commission[] = [],
    requestedOnboardingCall: boolean = false
  ) {
    this.leadId = leadId;
    this.funnel = funnel;
    this.products = products;
    this.totalAmount = totalAmount;
    this.customer = customer;
    this.affiliate = affiliate;
    this.domain = domain;
    this.payment = payment;
    this.invoice = invoice;
    this.commissions = commissions;
    this.requestedOnboardingCall = requestedOnboardingCall;
  }
}
