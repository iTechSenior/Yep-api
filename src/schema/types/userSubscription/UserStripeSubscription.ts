import { ObjectType, Field } from 'type-graphql';
import { StripeCustomerReference, StripePlanSummary, StripeProductReference } from '@/types/stripe';

@ObjectType()
export class UserStripeSubscription {
  @Field()
  subscriptionId: string;

  @Field(() => StripeCustomerReference)
  customer: StripeCustomerReference;

  @Field(() => StripePlanSummary)
  plan: StripePlanSummary;

  @Field(() => StripeProductReference)
  product: StripeProductReference;

  constructor(subscriptionId: string, customer: StripeCustomerReference, plan: StripePlanSummary, product: StripeProductReference) {
    this.subscriptionId = subscriptionId;
    this.customer = customer;
    this.plan = plan;
    this.product = product;
  }
}
