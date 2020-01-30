import { Field, ArgsType, Int } from 'type-graphql';

@ArgsType()
export class TablePaginationWithSearchTextAndBrandArgs {
  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  pageSize: number;

  @Field({ nullable: true })
  brand?: string;

  @Field({ nullable: true })
  searchText?: string;
}
