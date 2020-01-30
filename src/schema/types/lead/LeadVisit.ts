import { ObjectType, Field, ID } from 'type-graphql';
import { getNowUtc } from '@/helpers/utils';
import { FunnelReference } from '../funnel';
import { FunnelStepReference } from '../funnel/FunnelStepReference';
import { DomainReference } from '../domain';

@ObjectType()
export class LeadVisit {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field()
  leadId: string;

  @Field(() => FunnelReference)
  funnel: FunnelReference;

  @Field(() => FunnelStepReference)
  funnelStep: FunnelStepReference;

  @Field(() => DomainReference)
  domain: DomainReference;

  @Field()
  ip: string;

  @Field({ nullable: true, defaultValue: null })
  affiliateUserId: string;

  constructor(leadId: string, funnel: FunnelReference, funnelStep: FunnelStepReference, domain: DomainReference, ip: string, affiliateUserId: string = null) {
    this.leadId = leadId;
    this.funnel = funnel;
    this.funnelStep = funnelStep;
    this.domain = domain;
    this.ip = ip;
    this.affiliateUserId = affiliateUserId;
    this.createdAt = getNowUtc();
  }
}
