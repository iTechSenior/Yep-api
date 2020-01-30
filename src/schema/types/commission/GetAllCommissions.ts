import { ObjectType, Field, Float, Int } from 'type-graphql';
import { Commission } from './Commission';
@ObjectType()
export class GetAllCommissions {
  @Field(() => [Commission])
  commissions: Commission[];

  @Field(() => Float)
  totalCommissionPaid: number;

  @Field(() => Float)
  totalCommissionPending: number;

  @Field(() => Int)
  totalRows: number;

  constructor(commissions: Commission[], totalCommissionPaid: number, totalCommissionPending: number, totalRows: number) {
    this.commissions = commissions;
    this.totalCommissionPaid = totalCommissionPaid;
    this.totalCommissionPending = totalCommissionPending;
  }
}
