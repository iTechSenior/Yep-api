import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class AssuredTravelCertificateActivityResponse {
  @Field(() => Int)
  status: number;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  userMessageReference?: string;

  @Field(() => [String])
  items: string[];

  @Field()
  activityType: 'issued' | 'registered' | 'redeemed' | 'voided' | 'declined';

  @Field()
  Note: string;

  @Field()
  activityDateStamp: Date;

  @Field()
  certificateNumber: string;

  @Field()
  prospectID: string;
}
