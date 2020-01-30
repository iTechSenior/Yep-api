import { Field, ID, Int } from 'type-graphql';
import { UserReference } from '../user';
import { OrderReference } from '../order';
import moment = require('moment');

export class EscapeBuck {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => UserReference)
  user: UserReference;

  @Field(() => OrderReference)
  order: OrderReference;

  @Field(() => Int)
  bucks: number; // <----this is 5% of the total order amount

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  createdAt?: Date;
  constructor(user: UserReference = null, order: OrderReference = null, bucks: number = 0) {
    this.user = user;
    this.order = order;
    this.bucks = bucks;
    this.createdAt = moment().toDate();
    this.updatedAt = moment().toDate();
  }
}
