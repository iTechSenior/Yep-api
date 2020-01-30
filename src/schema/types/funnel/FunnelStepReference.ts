import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class FunnelStepReference {
  @Field(() => Int)
  stepOrder: number;

  @Field()
  url: string;

  constructor(stepOrder: number, url: string) {
    this.stepOrder = stepOrder;
    this.url = url;
  }
}
