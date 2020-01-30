import { Field, ObjectType } from 'type-graphql';
import { AuthorizeNetMessages } from './AuthorizeNetMessages';
@ObjectType()
export class AuthorizeNetTransaction {
  @Field()
  responseCode: string;

  @Field()
  authCode: string;

  @Field()
  avsResultCode: string;

  @Field()
  cvvResultCode: string;

  @Field()
  cavvResultCode: string;

  @Field()
  transId: string;

  @Field()
  refTransID: string;

  @Field()
  transHash: string;

  @Field()
  testRequest: string;

  @Field()
  accountNumber: string;

  @Field()
  accountType: string;

  @Field(() => AuthorizeNetMessages)
  messages: AuthorizeNetMessages;

  @Field()
  transHashSha2: string;
}
