import { ObjectType, Field, Int } from 'type-graphql';
import { YepHoldingUser } from './YepHoldingUser';
import { YepCommission } from '.';

@ObjectType()
export class YepHoldingTankList {
  @Field(() => [YepCommission])
  users: YepCommission[];

  @Field(() => Int)
  totalRows: number;
}
