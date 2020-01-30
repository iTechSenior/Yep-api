import { Field, InputType } from 'type-graphql';
@InputType()
export class CreditCardInput {
  @Field()
  number: string;
  @Field()
  month: string;
  @Field()
  year: string;
  @Field()
  cvc: string;
}
