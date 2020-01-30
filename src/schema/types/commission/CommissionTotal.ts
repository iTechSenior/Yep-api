import { ObjectType, Field, Float } from 'type-graphql';

@ObjectType()
export class CommissionTotal {
  @Field()
  userId: string;

  @Field(() => Float)
  commissionAmount: number;

  constructor(userId: string, commissionAmount: number) {
    this.userId = userId;
    this.commissionAmount = commissionAmount;
  }
}
