import { ArgsType, Field, InputType } from 'type-graphql';

@InputType()
export class ManualCommissionInput {
  @Field()
  commissionAmount: string;

  @Field()
  affiliateId: string;

  @Field()
  customerId: string;

  @Field()
  product: string;
}
