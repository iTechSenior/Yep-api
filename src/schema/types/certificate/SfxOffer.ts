import { Field, ObjectType, Int } from 'type-graphql';
import { SfxPriceAdjust } from './SfxPriceAdjust';

@ObjectType()
export class SfxOffer {
  @Field(() => Int)
  offer_id: number;

  @Field()
  name: string;

  @Field()
  description: string;

  @Field()
  comments: string;

  @Field()
  length_of_stay: string;

  @Field()
  room_type: string;

  @Field()
  retail_value: string;

  @Field()
  retail_price: string;

  @Field(() => SfxPriceAdjust)
  price_adjust: SfxPriceAdjust;

  @Field()
  price: string;
}
