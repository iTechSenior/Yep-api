import { ObjectType, Field, Int, Float } from 'type-graphql';

@ObjectType()
export class DownloadCommissions {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  payCommissionOn: Date;

  @Field(() => Float)
  commissionAmount: number;

  @Field(() => Int)
  count: number;
}
