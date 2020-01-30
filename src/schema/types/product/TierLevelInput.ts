import { Field, Int, ID, InputType } from 'type-graphql';

@InputType()
export class TierLevelInput {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  level: number;

  @Field()
  commissionType: string;

  @Field(() => Int)
  value: number;

  @Field(() => Int)
  daysToPayCommission: number;
}
