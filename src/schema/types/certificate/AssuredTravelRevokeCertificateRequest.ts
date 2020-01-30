import { ObjectType, Field } from 'type-graphql';
import { AssuredTravelRequestsBase } from './AssuredTravelRequestsBase';

@ObjectType()
export class AssuredTravelRevokeCertificateRequest extends AssuredTravelRequestsBase {
  @Field()
  certificateNumber: string;

  @Field()
  prospectId: string;

  @Field()
  reason: string;
}
