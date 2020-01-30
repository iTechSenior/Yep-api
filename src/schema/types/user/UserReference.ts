import { ObjectType, Field, ID } from 'type-graphql';
import { UserReferenceInput } from './UserReferenceInput';
import { IDocumentSession, SessionDocumentCounters } from 'ravendb';
import { JwtUser } from '../JwtUser';
import { User } from '.';

@ObjectType()
export class UserReference {
  static fromUserReferenceInput(data: UserReferenceInput) {
    return new this(data.id, data.email, data.firstName, data.lastName);
  }

  static async fromJwtUser(session: IDocumentSession, data: string) {
    const user = await session.load<User>(data);
    return new this(user.id, user.email, user.firstName, user.lastName);
  }

  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  constructor(id: string, email: string, firstName: string, lastName: string) {
    this.id = id;
    this.email = email;
    this.firstName = firstName;
    this.lastName = lastName;
  }
}
