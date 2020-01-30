import { ObjectType, Field, Int } from 'type-graphql';
import { FunnelStepProduct } from './FunnelStepProduct';

@ObjectType()
export class FunnelStep {
  @Field(() => Int)
  stepOrder: number;

  @Field()
  url: string;

  @Field(() => [FunnelStepProduct])
  products: FunnelStepProduct[];

  @Field()
  nextFunnelStepUrl: string;

  constructor(stepOrder: number, url: string, nextFunnelStepUrl: string, products: FunnelStepProduct[]) {
    this.stepOrder = stepOrder;
    this.nextFunnelStepUrl = nextFunnelStepUrl;
    this.products = products;
  }
}
