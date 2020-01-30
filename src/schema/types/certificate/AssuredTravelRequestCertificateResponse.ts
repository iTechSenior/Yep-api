import { ObjectType, Field, Int, Float } from 'type-graphql';
import { AssuredTravelResponseBase } from './AssureTravelResponseBase';

@ObjectType()
export class AssuredTravelRequestCertificateResponse extends AssuredTravelResponseBase {
  @Field()
  certificateNumber: string;

  @Field(() => Int)
  certificatePIN: number;

  @Field()
  certificateActivationCode: string;

  @Field(() => Float)
  certificateRegistrationFee: number;

  @Field(() => Int)
  maxDaysToRegister: number;

  @Field()
  registrationURL: string;
}
