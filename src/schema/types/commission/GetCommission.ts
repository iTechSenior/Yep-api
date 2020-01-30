import { ArgsType, Field, Int } from 'type-graphql';
import { DateFilter } from './DateFilter';

@ArgsType()
export class GetCommission {
  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  pageSize?: number;

  @Field()
  searchText: string;

  @Field()
  isAffiliate: boolean;

  @Field(() => DateFilter, { nullable: true })
  dateFilter?: DateFilter;
}
