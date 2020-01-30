import { Field, Int, ArgsType } from 'type-graphql';
@ArgsType()
export class TablePaginationArgs {
  @Field(() => Int, { defaultValue: 0 })
  skip: number = 0;

  @Field(() => Int, { defaultValue: 25 })
  pageSize: number = 25;
}
