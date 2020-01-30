import { ArgsType, Field, ObjectType } from 'type-graphql';

@ObjectType()
export class CreditCard {
  @Field()
  number: string;

  @Field()
  month: string;

  @Field()
  year: string;

  @Field()
  cvc: string;
}
