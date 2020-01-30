import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class YepBanner {
  @Field()
  url: string;

  @Field(() => Int)
  width: number;

  @Field(() => Int)
  height: number;
}
