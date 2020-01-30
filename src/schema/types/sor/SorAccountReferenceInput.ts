import { Field, InputType } from 'type-graphql';
@InputType()
export class SorAccountReferenceInput {
  @Field()
  userId: number;

  @Field()
  contractNumber: string;
}
