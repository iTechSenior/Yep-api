import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class AssuredTravelStatus {
  @Field()
  certificateNumber: string;

  @Field()
  prospectID: string;

  @Field()
  userMessageReference?: string;
}
