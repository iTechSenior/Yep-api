import { IStripeSubscriptionReference } from '@/helpers/interfaces';
import { StripePlanSummary } from './StripePlanSummary';
import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class StripeSubscriptionReference implements IStripeSubscriptionReference {
  @Field()
  id: string;

  @Field()
  userSubscriptionId: string;

  @Field()
  start: Date;

  @Field()
  end: Date;

  @Field(() => StripePlanSummary)
  plan: StripePlanSummary;

  constructor(id: string, start: Date, end: Date, plan: StripePlanSummary, userSubscriptionId: string) {
    this.id = id;
    this.start = start;
    this.end = end;
    this.plan = plan;
    this.userSubscriptionId = userSubscriptionId;
  }
}
