import { Field, Float, Int, InputType } from 'type-graphql';

@InputType()
export class StripePlanSummaryInput {
  @Field(() => Float)
  amount: number;

  @Field(() => Int)
  id: string;

  @Field()
  product: string;

  @Field()
  interval: string;

  @Field(() => Int)
  intervalCount: number;

  @Field()
  nickname: string;
}
