import { ObjectType, Field, Int } from 'type-graphql';
import { AssuredTravelRequestsBase } from './AssuredTravelRequestsBase';

@ObjectType()
export class AssuredTravelResponseBase extends AssuredTravelRequestsBase {
  @Field(() => Int)
  status: number;

  @Field({ nullable: true })
  error?: string;
}
