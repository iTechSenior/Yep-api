import { ObjectType, Field, Int, ID, GraphQLISODateTime } from 'type-graphql';
import { Playlist } from './index';

@ObjectType()
export class PlaylistResponse {
  @Field(() => [Playlist])
  playLists: Playlist[];

  @Field(() => Int)
  totalRows: number;
}
