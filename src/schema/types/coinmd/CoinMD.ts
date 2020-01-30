import { Field, ObjectType, Int, ArgsType } from 'type-graphql';

@ObjectType()
export class CoinMD {
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
  sponsorUsername?: string;

  // constructor(
  //   memberNumber: number,
  //   sponsorMemberNumber: number,
  //   sponsorEmail: string,
  //   sponsorFirstName: string,
  //   sponsorLastName: string,
  //   sponsorUsername: string
  // ) {
  //   this.memberNumber = memberNumber;
  //   this.sponsorMemberNumber = sponsorMemberNumber;
  //   this.sponsorEmail = sponsorEmail;
  //   this.sponsorFirstName = sponsorFirstName;
  //   this.sponsorLastName = sponsorLastName;
  //   this.sponsorUsername = sponsorUsername;
  // }
}
