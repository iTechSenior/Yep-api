import { ObjectType, Field, ID, Int } from 'type-graphql';
import { FunnelReferenceInput } from '../funnel';
import { ProductReferenceInput } from '../product';

@ObjectType()
export class OrderReferenceInput {
  @Field(() => ID)
  id: string;

  @Field(() => FunnelReferenceInput, { nullable: true })
  funnel?: FunnelReferenceInput;

  @Field(() => [ProductReferenceInput])
  products: ProductReferenceInput[];

  @Field(() => Int)
  orderTotal: number;
}
