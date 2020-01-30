import { Field, ObjectType } from 'type-graphql';
@ObjectType()
export class AuthorizeCaptureResult {
  @Field({ nullable: true })
  transId?: string;

  @Field({ nullable: true })
  authCode?: string;

  @Field()
  message: string;
}
