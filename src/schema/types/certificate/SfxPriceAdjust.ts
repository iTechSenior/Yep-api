import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class SfxPriceAdjust {
  @Field()
  type: string;

  @Field()
  amount: string;
}
