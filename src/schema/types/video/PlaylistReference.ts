import { ObjectType, Field } from 'type-graphql';
import { PlaylistReferenceInput } from './PlaylistReferenceInput';

@ObjectType()
export class PlaylistReference {
  static fromPlaylistReferenceInput(data: PlaylistReferenceInput) {
    return new this(data.id, data.title);
  }

  @Field()
  id: string;

  @Field()
  title: string;

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }
}
