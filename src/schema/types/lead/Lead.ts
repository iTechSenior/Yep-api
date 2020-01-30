import { UserReference } from '../user';
import { OrderReference } from '../order';
import { StripeSubscriptionReference } from '../stripe';
import { getNowUtc } from '@/helpers/utils';
import { ObjectType, Field, ID } from 'type-graphql';
import { FunnelReference } from '../funnel';
import { FunnelStepReference } from '../funnel/FunnelStepReference';
import { DomainReference } from '../domain';

@ObjectType()
export class Lead {
  @Field({ nullable: true })
  phone?: string;

  @Field(() => UserReference, { nullable: true })
  user?: UserReference;

  @Field(() => OrderReference, { nullable: true })
  order?: OrderReference;

  @Field(() => StripeSubscriptionReference, { nullable: true })
  subscription?: StripeSubscriptionReference;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => FunnelReference)
  funnel: FunnelReference;

  @Field(() => FunnelStepReference)
  funnelStep: FunnelStepReference;

  @Field(() => DomainReference)
  domain: DomainReference;

  @Field({ nullable: true, defaultValue: '' })
  ip?: string;

  @Field()
  uuid: string;

  @Field({ nullable: true, defaultValue: '' })
  email?: string;

  @Field({ nullable: true, defaultValue: '' })
  name?: string;

  @Field({ nullable: true, defaultValue: null })
  affiliateUserId?: string;

  constructor(
    funnel: FunnelReference,
    funnelStep: FunnelStepReference,
    domain: DomainReference,
    uuid: string,
    ip: string = '',
    email: string = '',
    name: string = '',
    affiliateUserId: string = null
  ) {
    this.funnel = funnel;
    this.funnelStep = funnelStep;
    this.domain = domain;
    this.ip = ip;
    this.uuid = uuid;
    this.email = email;
    this.name = name;
    this.affiliateUserId = affiliateUserId;
    this.createdAt = getNowUtc();
    this.updatedAt = getNowUtc();
  }
}
