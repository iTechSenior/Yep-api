import { Field, InputType, Int } from 'type-graphql';
@InputType()
export class CoinMDInput {
  @Field(() => Int)
  memberNumber: number;

  @Field(() => Int)
  sponsorMemberNumber: number;

  @Field()
  sponsorEmail: string;

  @Field({ nullable: true })
  sponsorFirstName?: string;

  @Field({ nullable: true })
  sponsorLastName?: string;

  @Field({ nullable: true })
  sponsorUsername: string;
}
