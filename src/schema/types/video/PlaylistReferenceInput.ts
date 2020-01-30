import { ObjectType, Field, InputType } from 'type-graphql';

@InputType()
export class PlaylistReferenceInput {
  @Field()
  id: string;

  @Field()
  title: string;
}
