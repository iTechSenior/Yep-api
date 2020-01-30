import { ObjectType, Field } from 'type-graphql';

export class AhAuAuthorizeCaptureResult {
  @Field({ nullable: true })
  transId?: string;

  @Field({ nullable: true })
  authCode?: string;

  @Field({ nullable: true })
  message?: string;
}
