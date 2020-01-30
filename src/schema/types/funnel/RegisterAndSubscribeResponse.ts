import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class RegisterAndSubscribeResponse {
  @Field(() => Boolean)
  public success: boolean;

  @Field({ nullable: true })
  public message?: string;

  @Field()
  public nextFunnelStepUrl: string;
}
