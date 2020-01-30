import { Field, InputType } from 'type-graphql';
import { ProductReferenceInput } from '../product';
import { FunnelReferenceInput } from '../funnel';

@InputType()
export class AffiliateLinkInput {
  @Field()
  url: string;

  @Field(() => ProductReferenceInput)
  product: ProductReferenceInput;

  @Field(() => FunnelReferenceInput)
  funnel: FunnelReferenceInput;
}
