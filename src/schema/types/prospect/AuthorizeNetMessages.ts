import { Field, ObjectType } from 'type-graphql';
import { AuthorizeNetMessage } from './AuthorizeNetMessage';

@ObjectType()
export class AuthorizeNetMessages {
  @Field(() => [AuthorizeNetMessage])
  message: AuthorizeNetMessage[];
}
