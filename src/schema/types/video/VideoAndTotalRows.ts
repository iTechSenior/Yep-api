import { Field, Int, ObjectType } from 'type-graphql';
import { Video } from './Video';

@ObjectType()
export class VideoAndTotalRows {
  @Field(() => [Video])
  videos: Video[];

  @Field(() => Int)
  totalRows: number;
}
