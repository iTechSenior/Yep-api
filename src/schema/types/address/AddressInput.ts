import { Field, InputType } from 'type-graphql';

@InputType()
export class AddressInput {
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
