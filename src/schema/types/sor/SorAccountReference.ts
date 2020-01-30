import { Field, ObjectType, Int } from 'type-graphql';
@ObjectType()
export class SorAccountReference {
  @Field(() => Int)
  userId: number;

  @Field()
  contractNumber: string;
}
