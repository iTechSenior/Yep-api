import { ObjectType, Field, ID, GraphQLISODateTime } from 'type-graphql';
import { getNowUtc, capitalizeEachFirstLetter } from '@/helpers/utils';
import { IDocumentSession } from 'ravendb';
import { ShareableContentInput } from './ShareableContentInput';
import { ContentTypeEnum, BrandTypeEnum } from '../Enums';
import { toUnicode } from 'punycode';

@ObjectType()
export class ShareableContent {
  static async fromShareableContentInput(session: IDocumentSession, data: ShareableContentInput) {
    let content: ShareableContent;
    console.log('data', data);
    const { id, category, subCategory, subject, text, sms, title, type, url, thumbnailUrl, brand, ...rest } = data;

    if (id) {
      content = await session.load(id);
    } else {
      content = new this(
        capitalizeEachFirstLetter(category),
        capitalizeEachFirstLetter(subCategory),
        subject,
        text,
        sms,
        title,
        url,
        type,
        brand,
        thumbnailUrl
      );
      content.createdAt = getNowUtc();
      await session.store(content);
    }

    Object.assign(content, {
      ...rest,
      category: capitalizeEachFirstLetter(category),
      subCategory: capitalizeEachFirstLetter(subCategory),
      subject,
      text,
      sms,
      title,
      url,
      type,
      brand,
      thumbnailUrl,
      updatedAt: getNowUtc(),
    });

    return content;
  }
  @Field(() => ID, { nullable: true })
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

  @Field(() => ContentTypeEnum)
  type: ContentTypeEnum;

  @Field()
  url: string;

  @Field(() => BrandTypeEnum)
  brand: BrandTypeEnum;

  @Field({ nullable: true })
  thumbnailUrl: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  constructor(
    category: string = '',
    subCategory: string = '',
    subject: string = '',
    text: string = '',
    sms: string = '',
    title: string = '',
    url: string = '',
    type: ContentTypeEnum = ContentTypeEnum.Video,
    brand: BrandTypeEnum = BrandTypeEnum.YEP,
    thumbnailUrl: string = ''
  ) {
    this.category = category;
    this.subCategory = subCategory;
    this.subject = subject;
    this.text = text;
    this.sms = sms;
    this.title = title;
    this.type = type;
    this.url = url;
    this.brand = brand;
    this.thumbnailUrl = thumbnailUrl;
  }
}
