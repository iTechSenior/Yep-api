import { ObjectType, ID, Field, Float } from 'type-graphql';
import { UserReference } from '@/types/user';
import { OrderReference } from '@/types/order';

@ObjectType()
export class RevenueShareOrder {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  revenueShareId: string;

  @Field(() => UserReference)
  user: UserReference;

  @Field(() => OrderReference)
  order: OrderReference;

  @Field(() => [String])
  commissions: string[];

  @Field(() => Float)
  totalCommissions: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
