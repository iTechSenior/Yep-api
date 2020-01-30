import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class CommissionRevenueShareInput {
  @Field()
  isRevenueShare: boolean;

  @Field()
  revenueShareId: string;
}
