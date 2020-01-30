import { ObjectType, Field, Int, Float } from 'type-graphql';

@ObjectType()
export class CouponCode {
  @Field()
  id: string;

  @Field()
  code: string;

  @Field()
  discountType: string;

  @Field(() => Float)
  discountAmount: number;

  @Field(() => Int)
  appliesToNumberOfGuests: number;

  @Field()
  appliesToExcursions: boolean;
}
