import { Field, ObjectType } from 'type-graphql';
import { ProductReference } from '../product';
import { FunnelReference } from '../funnel';

@ObjectType()
export class AffiliateLink {
  @Field()
  url: string;

  @Field(() => ProductReference)
  product: ProductReference;

  @Field(() => FunnelReference)
  funnel: FunnelReference;
}
