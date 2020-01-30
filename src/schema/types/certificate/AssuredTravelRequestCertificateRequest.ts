import { ObjectType, Field, Int } from 'type-graphql';
import { AssuredTravelRequestsBase } from './AssuredTravelRequestsBase';

@ObjectType()
export class AssuredTravelRequestCertificateRequest extends AssuredTravelRequestsBase {
  @Field(() => Int)
  certificateTypeId: number;

  @Field()
  memberId: string;

  @Field()
  prospectEmailAddress: string;

  @Field()
  prospectID: string;
}
