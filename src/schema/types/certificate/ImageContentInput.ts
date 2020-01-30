import { Field, ObjectType, Int, ArgsType, InputType } from 'type-graphql';

@InputType()
export class ImageContentInput {
  @Field()
  type: string;

  @Field()
  url: string;

  @Field(() => Int)
  displayOrder: number;
}
