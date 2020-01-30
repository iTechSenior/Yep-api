import { ObjectType, Field, Int } from 'type-graphql';
import { Message } from 'protobufjs';

@ObjectType()
export class ProPaySignupResponse {
  @Field()
  success: boolean;

  @Field(() => Int, { nullable: true })
  transType?: number;

  @Field({ nullable: true })
  status?: string;

  @Field(() => Int, { nullable: true })
  accountNumber?: number;

  @Field({ nullable: true })
  password?: string;

  @Field({ nullable: true })
  tier?: string;

  @Field({ nullable: true })
  message?: string;
}
