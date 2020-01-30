import { Field, ObjectType, Int } from 'type-graphql';
import { ProductReference } from '../product';

@ObjectType()
export class PromoCode {
  @Field()
  code: string;

  @Field({ nullable: true })
  discountType?: 'Percent' | 'Monetary' | 'Product' | 'Setup Fee';

  @Field(() => Int, { nullable: true })
  discountAmount?: number;

  @Field(() => Int, { nullable: true })
  maxUse?: number;

  @Field(() => Int, { nullable: true })
  currentUse?: number;

  @Field({ nullable: true })
  startDate?: Date;

  @Field({ nullable: true })
  endDate?: Date;

  @Field(() => ProductReference, { nullable: true })
  product?: ProductReference;

  constructor(
    code: string,
    discountType: 'Percent' | 'Monetary' | 'Product' | 'Setup Fee',
    discountAmount: number,
    maxUse: number,
    currentUse: number,
    startDate: Date = null,
    endDate: Date = null,
    product: ProductReference = null
  ) {
    this.code = code;
    this.discountType = discountType;
    this.discountAmount = discountAmount;
    this.maxUse = maxUse;
    this.currentUse = currentUse;
    this.startDate = startDate;
    this.endDate = endDate;
    this.product = product;
  }
}
