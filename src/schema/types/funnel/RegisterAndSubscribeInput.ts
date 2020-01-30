import { Field, ArgsType } from 'type-graphql';
import { FunnelUserOrderInput } from './FunnelUserOrderInput';

@ArgsType()
export class RegisterAndSubscribeArgs {
  @Field()
  public values: FunnelUserOrderInput;

  @Field()
  public fid: string;

  @Field()
  public aid: string;

  @Field()
  public step: number;

  @Field()
  public luid: string;

  @Field({ nullable: true })
  public notes?: string;

  @Field()
  public requestedOnboardingCall: boolean;
}
