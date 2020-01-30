import { ObjectType, Field, ID, Int } from 'type-graphql';
import { ProspectReference } from '../prospect/ProspectReference';
import { UserReference } from '../user';

@ObjectType()
export class CertificateRedemptionCode {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  fullRedemptionCode: string;

  @Field(() => Int)
  numericCode: number;

  @Field()
  certificateId: string;

  @Field()
  redeemed: boolean;

  @Field(() => ProspectReference, { nullable: true })
  prospect?: ProspectReference;

  @Field(() => UserReference, { nullable: true })
  user?: UserReference;

  constructor(
    fullRedemptionCode: string,
    numericCode: number,
    certificateId: string,
    redeemed: boolean = false,
    prospect: ProspectReference = null,
    user: UserReference = null
  ) {
    this.fullRedemptionCode = fullRedemptionCode;
    this.numericCode = numericCode;
    this.certificateId = certificateId;
    this.redeemed = redeemed;
    this.prospect = prospect;
    this.user = user;
  }
}
