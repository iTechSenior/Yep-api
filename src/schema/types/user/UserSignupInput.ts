import { DateTime } from 'luxon';
import { Field, InputType, ObjectType, GraphQLISODateTime, Int } from 'type-graphql';
import { ClickFunnelsAffiliateUrlInput } from '../clickFunnels';
import { StripeDataInput } from '../stripe';
import { AddressInput } from '../address';
import { SorAccountReferenceInput } from '../sor';
import { DomainReferenceInput } from '../domain';
import { SponsorInput } from '../sponsor/SponsorInput';
import { CoinMDInput } from '../coinmd';
import { AncestryInput } from '../ancestry';
import { UserCryptoInput } from '../userCrypto';
import { AffiliateLinkInput } from '../affiliateLink';
import { User } from './User';

@InputType()
export class UserSignupInput implements Partial<User> {
  @Field(() => Int, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  firstName?: string;

  @Field({ nullable: true })
  lastName?: string;

  @Field({ nullable: true })
  email?: string;

  @Field({ nullable: true })
  password?: string;

  @Field()
  active: boolean;

  @Field(() => [ClickFunnelsAffiliateUrlInput], { nullable: true })
  clickFunnelsAffiliateUrls?: ClickFunnelsAffiliateUrlInput[];

  @Field({ nullable: true })
  remoteLoginId?: string;

  @Field({ nullable: true })
  isSubscribed?: boolean;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => [String], { nullable: true })
  roles?: string[];

  @Field()
  username: string;

  @Field(() => StripeDataInput)
  stripe: StripeDataInput;

  @Field(() => AddressInput)
  address: AddressInput;

  @Field(() => SorAccountReferenceInput)
  sorAccount: SorAccountReferenceInput;

  @Field({ nullable: true })
  resetToken?: string;

  @Field(() => DomainReferenceInput, { nullable: true })
  domain: DomainReferenceInput;

  @Field(() => SponsorInput, { nullable: true })
  sponsor?: SponsorInput;

  // @Field(() => CoinMDInput, { nullable: true })
  // coinMD?: CoinMDInput;

  @Field(() => AncestryInput, { nullable: true })
  ancestry?: AncestryInput;

  @Field(() => [AffiliateLinkInput], { nullable: true })
  affiliateLinks: AffiliateLinkInput[];

  @Field()
  uuid: string;

  @Field(() => UserCryptoInput, { nullable: true })
  crypto?: UserCryptoInput;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  updatedAt?: Date;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [String], { nullable: true })
  threeForFreeUserIds?: string[];

  @Field()
  isW9onFile: boolean;

  @Field({ nullable: true })
  payoutMethod?: string;

  @Field({ nullable: true })
  paypalEmail?: string;

  @Field({ nullable: true })
  venmoAccount?: string;

  @Field()
  isBanned: boolean;
}
