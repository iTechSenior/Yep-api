import { Field, ObjectType } from 'type-graphql';
import { Video } from './Video';

@ObjectType()
export class YepVideoByIdResponse {
  @Field(() => Video)
  video: Video;

  @Field(() => [Video])
  related: Video[];
}
