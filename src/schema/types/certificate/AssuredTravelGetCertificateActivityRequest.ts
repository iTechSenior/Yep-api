import { ObjectType, Field } from 'type-graphql';
import { AssuredTravelRequestsBase } from './AssuredTravelRequestsBase';

@ObjectType()
export class AssuredTravelGetCertificateActivityRequest extends AssuredTravelRequestsBase {
  @Field()
  activityType: 1 | 2 | 3 | 4 | 5; // - 1=Issued 2=Registered 3=Redeemed 4=Voided 5=Declined

  @Field()
  fromDate: Date; //'MM/DD/YYYY'

  @Field()
  endDate: Date; //'MM/DD/YYYY'
}
