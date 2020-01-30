import { IStripeSubscriptionReference, IStripeCustomerInvoiceReference } from '@/helpers/interfaces';
import { StripeSubscriptionReference } from './StripeSubscriptionReference';
import { ObjectType, Field, InputType } from 'type-graphql';
import { StripeSubscriptionReferenceInput } from './StripeSubscriptionReferenceInput';

@InputType()
export class StripeCustomerInvoiceReferenceInput {
  @Field()
  eventId: string;

  @Field()
  customerId: string;

  @Field()
  chargeId: string;

  @Field()
  invoiceId: string;

  @Field(() => StripeSubscriptionReferenceInput)
  subscription: StripeSubscriptionReferenceInput;
}
