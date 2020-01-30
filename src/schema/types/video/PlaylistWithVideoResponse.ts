import { ObjectType, Field } from 'type-graphql';
import { Video, Playlist } from '.';

@ObjectType()
export class PlaylistWithVideoResponse {
  @Field(() => Playlist)
  playlist: Playlist;

  @Field(() => [Video])
  videos: Video[];
}
