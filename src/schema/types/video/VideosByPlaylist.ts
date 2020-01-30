import { ObjectType, Field, ArgsType } from 'type-graphql';
import { Video } from '.';

@ObjectType()
export class VideosByPlayList {
  @Field(() => [Video])
  videos: Video[];
}
