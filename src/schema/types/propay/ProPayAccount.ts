import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class ProPayAccount {
  @Field()
  success: boolean;

  @Field(() => Int, { nullable: true })
  accountNumber?: number;
}
