import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class AssuredTravelRevokeCertificateResponse {
  @Field()
  certificatedNumber: string;

  @Field()
  currentCertificateStatus: string;
}
