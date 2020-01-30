import { ObjectType, Field, ArgsType } from 'type-graphql';
@ObjectType()
export class VideoTag {
  @Field()
  tag: string;

  @Field(() => [String])
  children: string[];
}
