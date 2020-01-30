import { Field, Int, ArgsType } from 'type-graphql';
import { ImageContent } from './ImageContent';

@ArgsType()
export class AddDocumentToCertificate {
  @Field({ nullable: true })
  certificateId?: string;

  @Field()
  type: string;

  @Field()
  url: string;

  @Field(() => [ImageContent])
  images: ImageContent[];

  @Field(() => Int)
  displayOrder: number;

  @Field()
  active: boolean;
}
