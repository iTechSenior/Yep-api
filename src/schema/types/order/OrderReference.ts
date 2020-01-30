import { ObjectType, Field, ID, Int } from 'type-graphql';
import { FunnelReference } from '../funnel';
import { ProductReference } from '../product';

@ObjectType()
export class OrderReference {
  @Field(() => ID)
  id: string;

  @Field(() => FunnelReference, { nullable: true })
  funnel?: FunnelReference;

  @Field(() => [ProductReference])
  products: ProductReference[];

  @Field(() => Int)
  orderTotal: number;

  constructor(id: string, products: ProductReference[], orderTotal: number) {
    this.id = id;
    this.products = products;
    this.orderTotal = orderTotal;
  }
}
