import { StripePlanSummaryInput } from './StripePlanSummaryInput';
import { Field, InputType } from 'type-graphql';

@InputType()
export class StripeSubscriptionReferenceInput {
  @Field()
  id: string;

  @Field()
  userSubscriptionId: string;

  @Field()
  start: Date;

  @Field()
  end: Date;

  @Field(() => StripePlanSummaryInput)
  plan: StripePlanSummaryInput;
}
