import { ArgsType, Field, InputType } from 'type-graphql';

@InputType()
export class RemoveCommissionArgs {
  @Field()
  commissionId: string;
  @Field()
  orderId: string;
}
