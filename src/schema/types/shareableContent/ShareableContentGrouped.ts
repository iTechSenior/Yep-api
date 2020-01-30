import { ObjectType, Field } from 'type-graphql';
import { ShareableContent } from '.';

@ObjectType()
export class ShareableContentGrouped {
  @Field()
  category: string;

  @Field(() => [ShareableContent])
  shareableContent: ShareableContent[];
}
