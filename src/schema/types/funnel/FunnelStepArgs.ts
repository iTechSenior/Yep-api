import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class FunnelStepArgs {
  @Field()
  path: string;

  @Field({ nullable: true })
  luid?: string;

  @Field({ nullable: true })
  aid?: string;

  @Field({ nullable: true })
  host?: string;
}
