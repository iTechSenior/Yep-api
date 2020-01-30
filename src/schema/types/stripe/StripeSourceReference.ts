import { ObjectType, Field, Int } from 'type-graphql';
import { IStripeSourceReference } from '@/helpers/interfaces';

@ObjectType()
export class StripeSourceReference implements IStripeSourceReference {
  @Field()
  id: string;

  @Field()
  brand: string;

  @Field()
  country: string;

  @Field()
  last4: string;

  @Field(() => Int)
  expMonth: number;

  @Field(() => Int)
  expYear: number;

  constructor(id: string, brand: string, country: string, last4: string, expMonth: number, expYear: number) {
    this.id = id;
    this.brand = brand;
    this.country = country;
    this.last4 = last4;
    this.expMonth = expMonth;
    this.expYear = expYear;
  }
}
