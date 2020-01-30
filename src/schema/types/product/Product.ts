import { ObjectType, Field, ID, Int } from 'type-graphql';
import { TierLevel } from './TierLevel';
import { DomainReference } from '../domain/';
import { StripeProductReference, StripePlanReference } from '@/types/stripe';
import { ProductSetup } from './ProductSetup';
import { PaymentAccountEnum } from '../Enums';

@ObjectType()
export class Product {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => Int)
  amount: number;

  @Field(() => DomainReference)
  domain: DomainReference;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field(() => [TierLevel])
  tierPayouts: TierLevel[];

  @Field(() => [String])
  roles?: string[];

  @Field({ nullable: true })
  sorAccount?: string;

  @Field(() => StripeProductReference)
  product: StripeProductReference;

  @Field(() => StripePlanReference)
  plan: StripePlanReference;

  @Field(() => ProductSetup)
  setup: ProductSetup;

  @Field(() => PaymentAccountEnum)
  paymentAccount: PaymentAccountEnum;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    amount: number = 0,
    tierPayouts: TierLevel[] = null,
    name: string = '',
    displayName: string,
    domain: DomainReference = null,
    product: StripeProductReference,
    plan: StripePlanReference,
    setup: ProductSetup,
    paymentAccount: PaymentAccountEnum
  ) {}
}
