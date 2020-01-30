import { ObjectType, Field, ID, Float, InputType } from 'type-graphql';
import { UserReference } from '@/types/user';
import { TierLevel } from '../product/TierLevel';
import { CommissionRevenueShare } from './CommissionRevenueShare';
import { OrderReference } from '../order';
import moment = require('moment');
import { StripeCustomerInvoiceReference } from '@/types/stripe';
import { UserReferenceInput } from '../user/UserReferenceInput';
import { TierLevelInput } from '../product';
import { StripeCustomerInvoiceReferenceInput } from '../stripe/StripeCustomerInvoiceReferenceInput';
import { OrderReferenceInput } from '../order/OrderReferenceInput';
import { CommissionRevenueShareInput } from '.';
import { FunnelReferenceInput } from '../funnel';

@InputType()
export class CommissionInput {
  @Field()
  id: string;

  @Field(() => UserReferenceInput)
  user: UserReferenceInput;

  @Field()
  orderId: string;

  @Field(() => FunnelReferenceInput)
  funnel: FunnelReferenceInput;

  @Field()
  payCommissionOn: Date;

  @Field(() => Float)
  commissionAmount: number;

  @Field()
  status: 'Pending' | 'Paid' | 'Refunded';

  @Field({ nullable: true })
  createdAt?: Date;
}
