import { Field, ArgsType, Int } from 'type-graphql';
import { TablePaginationArgs } from './TablePaginationArgs';
@ArgsType()
export class TablePaginationWithSearchTextArgs {
  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  pageSize: number;

  @Field({ nullable: true })
  searchText?: string;
}
