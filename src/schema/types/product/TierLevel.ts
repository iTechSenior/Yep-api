import { ObjectType, Field, Int, ID } from 'type-graphql';

@ObjectType()
export class TierLevel {
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
