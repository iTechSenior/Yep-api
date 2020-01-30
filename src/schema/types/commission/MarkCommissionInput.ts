import { Field, ID, InputType } from 'type-graphql';

@InputType()
export class MarkCommissionInput {
  @Field(() => [ID])
  id: string[];
}
