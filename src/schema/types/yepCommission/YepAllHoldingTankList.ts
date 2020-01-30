import { ObjectType, Field, Int } from 'type-graphql';
import { YepCommission } from '.';

@ObjectType()
export class YepAllHoldingTankList {
  @Field(() => [YepCommission])
  commissions: YepCommission[];

  @Field(() => Int)
  totalRows: number;
}
