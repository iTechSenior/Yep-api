import { Field, Int, ObjectType } from 'type-graphql';
import { ShareableContent } from './ShareableContent';

@ObjectType()
export class ContentList {
  @Field(() => Int)
  totalRows: number;

  @Field(() => [ShareableContent])
  contents: ShareableContent[];
}
