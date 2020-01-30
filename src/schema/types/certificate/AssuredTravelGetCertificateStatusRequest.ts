import { ObjectType, Field } from 'type-graphql';
import { AssuredTravelRequestsBase } from './AssuredTravelRequestsBase';

@ObjectType()
export class AssuredTravelGetCertificateStatusRequest extends AssuredTravelRequestsBase {
  @Field()
  certificateNumber: string;

  @Field()
  prospectId: string;
}
