import { Field, Int, ArgsType, InputType } from 'type-graphql';

@InputType()
export class DisplayOrder {
  @Field(() => Int)
  displayOrder: number;

  @Field()
  videoId: string;
}
