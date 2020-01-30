import { ArgsType, Field } from 'type-graphql';

@ArgsType()
export class GetVideosArgs {
  @Field()
  category: string;

  @Field()
  subCategory: string;
}
