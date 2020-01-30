import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Country3DigitListItem {
  @Field()
  name: string;

  @Field()
  alphaCode: string;

  @Field()
  numericCode: string;
}
