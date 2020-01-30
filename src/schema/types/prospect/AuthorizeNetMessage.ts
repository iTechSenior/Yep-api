import { Field, ObjectType } from 'type-graphql';
@ObjectType()
export class AuthorizeNetMessage {
  @Field()
  code: string;

  @Field()
  description: string;
}
