import { ObjectType, Field, Float, Int, ID } from 'type-graphql';

@ObjectType()
export class StripePlanSummary {
  @Field(() => Float)
  amount: number;

  @Field(() => ID)
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
