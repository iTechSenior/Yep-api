import { Field, InputType } from 'type-graphql';
@InputType()
export class StripeDataInput {

  @Field()
  customerId: string;

  @Field({ nullable: true })
  subscriptionId?: string;

  @Field({ nullable: true })
  productId?: string;

  @Field({ nullable: true })
  planId?: string;

  @Field({ nullable: true })
  status?: string;

  @Field()
  paymentAccountKey?: string;

}
