import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class VideoUrlArgs {
  @Field()
  videoUrl: string;
}
