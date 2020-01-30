import { InputType, ArgsType, Field, Int } from 'type-graphql';

@ArgsType()
export class ProPayAccountNumberInput {
  @Field(() => Int)
  accountNumber: number;
}
