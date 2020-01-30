import { ObjectType, Field, Int, ID } from 'type-graphql';
import { ImageContent } from '../certificate';

@ObjectType()
export class Document {
  @Field(() => ID, { nullable: true })
  id?: string;

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

  constructor(id: string, type: string = '', url: string = '', displayOrder: number = 1, images: ImageContent[] = [], active: boolean = false) {
    this.id = id;
    this.url = url;
    this.displayOrder = displayOrder;
    this.images = images;
    this.active = active;
  }
}
