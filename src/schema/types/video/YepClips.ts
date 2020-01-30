import { ObjectType, Field } from 'type-graphql';
import { Video, Playlist } from '.';

@ObjectType()
export class YepClips {
  @Field()
  category: string;

  @Field(() => [Video])
  videos: Video[];
}

@ObjectType()
export class YepClipsPlaylistsGroupedByCategory {
  @Field({ defaultValue: '' })
  category: string;

  @Field(() => [Playlist])
  playlists: Playlist[];
}
