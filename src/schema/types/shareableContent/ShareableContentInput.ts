import { ArgsType, Field, InputType } from 'type-graphql';
import { ContentTypeEnum, BrandTypeEnum } from '../Enums';
@InputType()
export class ShareableContentInput {
  @Field({ nullable: true })
  id?: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field()
  subject: string;

  @Field()
  text: string;

  @Field()
  sms: string;

  @Field()
  title: string;

  @Field()
  url: string;

  @Field(() => ContentTypeEnum)
  type: ContentTypeEnum;

  @Field(() => BrandTypeEnum)
  brand: BrandTypeEnum;

  @Field({ nullable: true })
  thumbnailUrl?: string;
}
