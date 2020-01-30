import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class AssuredTravelCertificateStatusResponse {
  @Field(() => Int)
  status: number;

  @Field({ nullable: true })
  error?: string;

  @Field({ nullable: true })
  userMessageReference?: string;

  @Field()
  certificateNumber: string;

  @Field()
  currentCertificateStatus: 'new' | 'activated' | 'redeemed' | 'deactivated';
}
