import { ObjectType, Field, Int } from "type-graphql";

@ObjectType()
export class SfxCertificateOrderRequest {
  @Field(() => Int)
  offerId: number;

  @Field()
  memberId: string;

  @Field()
  prospectEmailAddress: string;

  @Field()
  prospectID: string;
  constructor(offerId: number, memberId: string, prospectEmailAddress: string, prospectID: string) {
    this.offerId = offerId;
    this.memberId = memberId;
    this.prospectEmailAddress = prospectEmailAddress;
    this.prospectID = prospectID;
  }
}
