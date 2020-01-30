import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class VideoCategoryArgs {
  @Field()
  category: string;
}
