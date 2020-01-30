import { ArgsType, Field } from 'type-graphql';
import { DisplayOrder } from './index';
import { VideoStatusEnum } from '../Enums';
@ArgsType()
export class PlaylistArgs {
  @Field({ nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field({ defaultValue: '' })
  description: string;

  @Field()
  trainer: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field({ nullable: true, defaultValue: '' })
  thumbnailUrl: string;

  @Field(() => VideoStatusEnum)
  status: VideoStatusEnum;

  @Field(() => [DisplayOrder], { nullable: true })
  videos?: DisplayOrder[];
}
