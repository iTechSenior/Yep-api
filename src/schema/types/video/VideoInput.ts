import { Field, ID, InputType, Int } from 'type-graphql';

@InputType()
export class VideoInput {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  videoTitle: string;

  @Field({ nullable: true })
  videoUrl: string;

  @Field({ nullable: true })
  videoS3Url: string;

  @Field()
  videoThumbnailUrl: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field()
  language: string;

  @Field()
  description: string;

  @Field()
  brand: string;

  @Field()
  trainer: string;

  @Field(() => Int, { nullable: true })
  displayOrder: number;

  @Field({ nullable: true })
  playlist: string;
}
