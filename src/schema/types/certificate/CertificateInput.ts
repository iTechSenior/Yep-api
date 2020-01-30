import { Field, Int, InputType, ArgsType } from 'type-graphql';
import { ImageContentInput } from './ImageContentInput';

@InputType()
export class CertificateInput {
  @Field()
  id: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  imageUrl: string;

  @Field(() => [String], { nullable: true })
  //membershipLevel: ('TVI PLUS' | 'TVI PRO' | 'TVI BASIC')[];
  membershipLevel: string[];

  @Field()
  apiAccessToken: string;

  @Field()
  active: boolean;

  @Field()
  defaultMessage: string;

  @Field(() => Int)
  displayOrder: number;

  @Field(() => [ImageContentInput])
  images: ImageContentInput[];
}
