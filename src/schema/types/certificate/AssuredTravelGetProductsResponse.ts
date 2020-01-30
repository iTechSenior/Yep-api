import { ObjectType, Field, Int, Float } from 'type-graphql';
import { AssuredTravelResponseBase } from './AssureTravelResponseBase';

@ObjectType()
export class AssuredTravelGetProductsResponse extends AssuredTravelResponseBase {
  @Field(() => Int)
  certificateTypeID: number;

  @Field()
  certificateTypeDescription: string;

  @Field(() => Float)
  certificateRegistrationFee: number;

  @Field(() => Int)
  maxDaysToRegister: number;
}
