import { Field, ObjectType, Int, ArgsType, InputType } from 'type-graphql';

@ObjectType()
export class ImageContent {
  @Field()
  type: string;

  @Field()
  url: string;

  @Field(() => Int)
  displayOrder: number;

  constructor(type: string = '', url: string = '', displayOrder: number = 1) {
    this.type = type;
    this.url = url;
    this.displayOrder = displayOrder;
  }
}
