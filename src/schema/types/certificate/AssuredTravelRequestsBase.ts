import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class AssuredTravelRequestsBase {
  @Field()
  userMessageReference: string;
}
