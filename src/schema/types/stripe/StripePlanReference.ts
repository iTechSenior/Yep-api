import { IStripePlanSummary } from '@/helpers/interfaces';
import { Field, Float, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class StripePlanReference implements IStripePlanSummary {
  @Field(() => Float)
  amount: number;

  @Field(() => Int)
  id: string;

  @Field()
  product: string;

  @Field()
  interval: string;

  @Field(() => Int)
  intervalCount: number;

  @Field()
  nickname: string;
  constructor(id: string, nickname: string, interval: string, intervalCount: number, amount: number, product: string) {
    this.id = id;
    this.nickname = nickname;
    this.interval = interval;
    this.intervalCount = intervalCount;
    this.amount = amount;
    this.product = product;
  }
}
