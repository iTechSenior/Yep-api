import { Field, ObjectType, Int, Float } from 'type-graphql';
import { User } from './User';
@ObjectType()
export class MeResponse {
  @Field(() => User, { nullable: true })
  user?: User;

  @Field(() => Int)
  threeForFreeCount: number;

  @Field(() => Float)
  escapeBucks: number;
}
