import { ObjectType, Field, Int, ID, InputType, ArgsType } from 'type-graphql';

@ArgsType()
export class EditVideoArgs {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  videoTitle: string;

  @Field({ nullable: true, defaultValue: '' })
  videoUrl: string;

  @Field({ nullable: true, defaultValue: '' })
  videoS3Url: string;

  @Field()
  videoThumbnailUrl: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field()
  description: string;

  @Field()
  language: string;

  @Field()
  trainer: string;

  @Field()
  brand: string;

  @Field(() => Int)
  displayOrder: number;

  @Field()
  playList: string;
}
