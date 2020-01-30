import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class SfxCertificateRequest {
  @Field(() => Int)
  offerId: number;

  @Field()
  memberId: string;

  @Field()
  prospectEmailAddress: string;

  @Field()
  prospectID: string;
}
