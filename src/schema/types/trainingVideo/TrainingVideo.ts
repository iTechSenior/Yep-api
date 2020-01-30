import { ObjectType, Field, ID } from 'type-graphql';
import { UserReference, User } from '../user';

class TrainingVideo {
  @Field(() => ID, {})
  id?: string;

  @Field(() => UserReference)
  user: UserReference;

  @Field()
  videoUrl: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field()
  language: string;

  @Field()
  description: string;

  constructor(user: UserReference, videoUrl: string, category: string, subCategory: string, language: string, description: string) {
    this.user = user;
    this.videoUrl = videoUrl;
    this.category = category;
    this.subCategory = subCategory;
    this.language = language;
    this.description = description;
  }
}
