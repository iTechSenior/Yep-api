import { ObjectType, Field, ID, Int } from 'type-graphql';
import { FunnelReference } from '../funnel';
import { FilterRootFields } from 'graphql-tools';
import { UserReference } from '../user';
@ObjectType()
export class RevenueShare {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => FunnelReference, { nullable: true })
  funnel?: FunnelReference;

  @Field(() => UserReference)
  user: UserReference;

  @Field({ nullable: true })
  userRole?: string;

  @Field(() => Int, { nullable: true })
  daysToPayCommission: number;

  @Field()
  commissionType: 'Percentage' | 'Fixed Amount';

  @Field(() => Int)
  commissionAmount: number;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;
}
