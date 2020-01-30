import { Field, ObjectType } from 'type-graphql';
@ObjectType()
export class Address {
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

  constructor(address: string, city: string, state: string, zip: string, country: string) {
    this.address = address;
    this.city = city;
    this.state = state;
    this.zip = zip;
    this.country = country;
  }
}
