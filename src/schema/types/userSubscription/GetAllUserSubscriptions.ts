import { ObjectType, Field, Int } from 'type-graphql';
import { UserSubscription } from './UserSubscription';

@ObjectType()
export class GetAllUserSubscriptions {
  @Field(() => [UserSubscription])
  userSubscriptions: UserSubscription[];

  @Field(() => Int)
  totalRows: number;
}
