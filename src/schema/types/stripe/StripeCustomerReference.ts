import { IStripeCustomerReference } from '@/helpers/interfaces';
import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class StripeCustomerReference implements IStripeCustomerReference {
  @Field()
  id: string;

  @Field()
  email: string;

  constructor(id: string, email: string) {
    this.id = id;
    this.email = email;
  }
}
