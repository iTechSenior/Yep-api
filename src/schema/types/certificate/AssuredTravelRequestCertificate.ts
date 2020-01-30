import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class AssuredTravelRequestCertificate {
  @Field(() => Int)
  certificateTypeID: number;

  @Field()
  prospectID: string;

  @Field()
  memberID: string;

  @Field()
  prospectEmailAddress: string;

  @Field({ nullable: true })
  userMessageReference?: string;
}
