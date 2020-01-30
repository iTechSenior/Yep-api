import { Field, ObjectType } from 'type-graphql';
@ObjectType()
export class StripeData {
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

  @Field({ nullable: true })
  paymentAccountKey?: string;

  constructor(customerId: string, subscriptionId?: string, productId?: string, planId?: string, status?: string, paymentAccountKey?: string) {
    this.customerId = customerId;
    this.subscriptionId = subscriptionId;
    this.productId = productId;
    this.planId = planId;
    this.status = status;
    this.paymentAccountKey = paymentAccountKey;
  }
}
