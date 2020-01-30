import { InputType, Field } from 'type-graphql';

@InputType()
export class ProPayInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  dayOfBirth: string;

  @Field()
  ssn: string;

  @Field()
  sourceEmail: string;

  @Field()
  dayPhone: string;

  @Field()
  evenPhone: string;

  @Field()
  address: string;

  @Field()
  city: string;

  @Field()
  state: string;

  @Field()
  zip: string;

  @Field()
  country: string;
}
