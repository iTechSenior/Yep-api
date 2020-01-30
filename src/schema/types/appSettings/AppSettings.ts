import { Field, ObjectType, ID } from 'type-graphql';
import { Migration } from './Migration';
import { VideoTag } from '../video';

@ObjectType()
export class AppSettings {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => [String])
  categories: string[];

  @Field(() => [VideoTag])
  tags: VideoTag[];

  @Field(() => [String], { nullable: true })
  roles?: string[];

  @Field(() => [String], { nullable: true })
  sorAccount?: string[];

  @Field(() => [String], { nullable: true })
  plans?: string[];

  @Field(() => [Migration], { nullable: true })
  migrations?: Migration[];

  constructor(id?: string, categories: string[] = [], tags: VideoTag[] = []) {
    this.id = id;
    this.categories = categories;
    this.tags = tags;
  }
}
