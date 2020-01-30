import { IStripeChargeReference } from '@/helpers/interfaces';
import { ObjectType, Field, Float } from 'type-graphql';
import { StripeCustomerReference } from './StripeCustomerReference';
import { StripeSourceReference } from './StripeSourceReference';

@ObjectType()
export class StripeChargeReference implements IStripeChargeReference {
  @Field()
  public id: string;

  @Field(() => Float)
  public amount: number;

  @Field()
  public created: Date;

  @Field(() => StripeCustomerReference)
  public customer: StripeCustomerReference;

  @Field()
  public description: string;

  @Field()
  public paid: boolean;

  @Field(() => StripeSourceReference)
  public source: StripeSourceReference;

  @Field()
  public status: string;

  constructor(
    id: string,
    amount: number,
    created: Date,
    customer: StripeCustomerReference,
    description: string,
    paid: boolean,
    source: StripeSourceReference,
    status: string
  ) {
    this.id = id;
    this.amount = amount;
    this.created = created;
    this.customer = customer;
    this.description = description;
    this.paid = paid;
    this.source = source;
    this.status = status;
  }
}
