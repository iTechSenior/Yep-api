import { ObjectType, Field, Int } from 'type-graphql';
import { User } from './User';

@ObjectType()
export class UserBasics {
  static fromUser(data: User) {
    return new this(data.id, data.firstName, data.lastName, data.email, data.uuid);
  }

  @Field()
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  uuid: string;

  constructor(id: string, firstName: string, lastName: string, email: string, uuid: string) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.uuid = uuid;
  }
}
