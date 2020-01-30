import { IStripeSubscriptionReference, IStripeCustomerInvoiceReference } from '@/helpers/interfaces';
import { StripeSubscriptionReference } from './StripeSubscriptionReference';
import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class StripeCustomerInvoiceReference implements IStripeCustomerInvoiceReference {
  @Field()
  eventId: string;

  @Field()
  customerId: string;

  @Field()
  chargeId: string;

  @Field()
  invoiceId: string;

  @Field(() => StripeSubscriptionReference)
  subscription: StripeSubscriptionReference;

  constructor(eventId: string, customerId: string, chargeId: string, invoiceId: string, subscription: StripeSubscriptionReference) {
    this.eventId = eventId;
    this.customerId = customerId;
    this.chargeId = chargeId;
    this.invoiceId = invoiceId;
    this.subscription = subscription;
  }
}
