import { ObjectType, Field, ID } from 'type-graphql';
import { OrderReference } from '../order';
import { UserReference } from '@/types/user';
import moment = require('moment');

@ObjectType()
export class StripeWebhook {
  @Field(() => ID)
  id: string;

  @Field(() => OrderReference, { nullable: true })
  order?: OrderReference;

  @Field(() => UserReference, { nullable: true })
  customerUser?: UserReference;

  @Field(() => UserReference, { nullable: true })
  affiliateUser?: UserReference;

  @Field()
  type: string;

  @Field({ nullable: true })
  createdAt?: Date;

  public webhook: any;

  constructor(id: string, type: string, webhook: any = {}, order?: OrderReference, customerUser?: UserReference, affiliateUser?: UserReference) {
    this.id = id;
    this.type = type;
    this.webhook = webhook;
    this.order = order;
    this.customerUser = customerUser;
    this.affiliateUser = affiliateUser;
    this.createdAt = moment().toDate();
  }
}
