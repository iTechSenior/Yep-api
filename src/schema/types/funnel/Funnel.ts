import { ObjectType, Field, ID } from 'type-graphql';
import { FunnelStep } from './FunnelStep';
import { DomainReference } from '../domain';

@ObjectType()
export class Funnel {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field()
  active: boolean;

  @Field()
  hidden: boolean;

  @Field(() => [FunnelStep])
  funnelSteps: FunnelStep[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field(() => DomainReference)
  domain: DomainReference;

  @Field(() => [String], { nullable: true })
  pastUrls?: string[];

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(title: string = '', active: boolean = false, hidden: boolean = false, funnelSteps: FunnelStep[] = null, domain: DomainReference = null) {
    this.title = title;
    this.active = active;
    this.hidden = hidden;
    this.funnelSteps = funnelSteps;
    this.domain = domain;
  }
}
