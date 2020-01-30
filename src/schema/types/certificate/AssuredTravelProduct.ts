import { Field, ObjectType, Int, Float } from 'type-graphql';

@ObjectType()
export class AssuredTravelProduct {
  @Field(() => Int)
  certificateTypeID: number;

  @Field()
  certificateTypeDescription: string;

  @Field(() => Float)
  certificateRegistrationFee: number;

  @Field(() => Int)
  maxDaysToRegister: number;
}
