import { Field, ObjectType } from 'type-graphql';
import { User } from './User';

@ObjectType()
export class LoginResponse {
  @Field(() => User)
  user: User;

  @Field()
  token: string;

  constructor(user: User, token: string) {
    this.user = user;
    this.token = token;
  }
}
