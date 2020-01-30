import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class CountryListItem {
  @Field()
  name: string;

  @Field()
  code: string;

  @Field()
  phone_code: string;
}
