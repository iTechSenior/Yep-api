import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class YepCompensationSideArgs {
  @Field()
  id: string;

  @Field()
  side: string;
}
