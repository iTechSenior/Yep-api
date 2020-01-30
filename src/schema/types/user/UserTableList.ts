import { Field, ObjectType, Int } from 'type-graphql';
import { User } from './User';

@ObjectType()
export class UserTableList {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  totalRows: number;
}
