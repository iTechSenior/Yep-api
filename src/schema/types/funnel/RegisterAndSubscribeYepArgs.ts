import { Field, ArgsType } from 'type-graphql';
import { FunnelUserOrderInput } from './FunnelUserOrderInput';

@ArgsType()
export class RegisterAndSubscribeYepArgs {
  @Field()
  public values: FunnelUserOrderInput;

  @Field()
  public fid: string;

  @Field({ nullable: true })
  public aid?: string;

  @Field()
  public luid: string;

  @Field()
  public requestType: 'Initial' | 'SCA_SUCCESS' | 'SCA_FAIL';

  @Field({ nullable: true })
  public paymentIntentId?: string;
}
