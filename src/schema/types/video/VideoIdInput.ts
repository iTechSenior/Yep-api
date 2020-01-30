import { InputType, Field } from 'type-graphql';

@InputType()
export class VideoUrlInput {
  @Field()
  videoUrl: string;
}
