import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class YepProduct {
  @Field(() => ID)
  id: string;

  @Field()
  pcode: string;

  @Field()
  pdesc: string;

  @Field()
  groupname: string;

  @Field()
  unit: string;

  @Field()
  price: string;

  @Field()
  pv: string;

  @Field()
  type: string;

  @Field()
  yepProductId: string;

  constructor(pcode: string, pdesc: string, groupname: string, unit: string, price: string, pv: string, tv: string, yepProductId: string) {
    this.pcode = pcode;
    this.pdesc = pdesc;
    this.groupname = groupname;
    this.unit = unit;
    this.price = price;
    this.pv = pv;
    this.yepProductId = yepProductId;
  }
}
