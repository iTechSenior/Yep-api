import { ObjectType, Field } from 'type-graphql';
import { FunnelStep } from './FunnelStep';
import { UserBasics } from '../user/UserBasics';

@ObjectType()
export class FunnelStepWithData {
  @Field()
  public fid: string;

  @Field()
  public funnelStep: FunnelStep;

  @Field({ nullable: true })
  public luid?: string;

  @Field({ nullable: true })
  public affiliate?: UserBasics;
}
