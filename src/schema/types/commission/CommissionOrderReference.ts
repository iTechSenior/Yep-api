import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class CommissionOrderReference {
  @Field()
  orderId: string;

  @Field()
  productNames: string;

  @Field(() => Int)
  productAmount: number;

  constructor(orderId: string, productNames: string, productAmount: number) {
    this.orderId = orderId;
    this.productNames = productNames;
    this.productAmount = productAmount;
  }
}
