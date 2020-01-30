import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class CommissionRevenueShare {
  @Field()
  isRevenueShare: boolean;

  @Field()
  revenueShareId: string;

  constructor(isRevenueShare: boolean, revenueShareId: string) {
    this.isRevenueShare = isRevenueShare;
    this.revenueShareId = revenueShareId;
  }
}
