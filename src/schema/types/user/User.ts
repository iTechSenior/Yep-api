import { DateTime } from 'luxon';
import { IDocumentSession } from 'ravendb';
import { Field, ObjectType, ID, GraphQLISODateTime, Int } from 'type-graphql';
import { UserInput } from './UserInput';
import { DomainReference } from '../domain';
import { CoinMD } from '../coinmd';
import { Sponsor } from '../sponsor';
import { Ancestry } from '../ancestry';
import { UserCrypto } from '../userCrypto';
import { AffiliateLink } from '../affiliateLink';
import { ClickFunnelsAffiliateUrl } from '../clickFunnels';
import { StripeData } from '../stripe';
import { Address } from '../address';
import { SorAccountReference } from '../sor';
import { getValidUsername } from '@/helpers/utils';
import { Binary } from './Binary';
import { MobileDevice } from '.';
import { MaxlineUser } from './MaxlineUser';
import { ProPayAccount } from '../propay';
import { Coordinate } from '../event';
import { W7GUser } from './W7GUser';

@ObjectType()
export class User {
  static async fromUserInput(session: IDocumentSession, data: UserInput) {
    let user: User;
    const { id, createdOn, updatedOn, ...rest } = data;
    user = data.id
      ? await session.load(data.id)
      : new this(
          data.uuid,
          data.firstName,
          data.lastName,
          await getValidUsername(session, `${data.firstName}.${data.lastName}`.toLowerCase()),
          data.email,
          data.password,
          data.active,
          [],
          [],
          null,
          false,
          null,
          ['Affiliate'],
          []
        );
    Object.assign(user, { ...rest, updatedAt: DateTime.utc().toJSDate() });
    return user;
  }
  @Field(() => ID, { nullable: true })
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

  @Field(() => [ClickFunnelsAffiliateUrl], { nullable: true })
  clickFunnelsAffiliateUrls?: ClickFunnelsAffiliateUrl[];

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

  @Field(() => StripeData)
  stripe: StripeData;

  @Field(() => Address)
  address: Address;

  @Field(() => Coordinate, { nullable: true })
  coordinate?: Coordinate;

  @Field(() => SorAccountReference)
  sorAccount: SorAccountReference;

  @Field({ nullable: true })
  resetToken?: string;

  @Field(() => DomainReference, { nullable: true })
  domain?: DomainReference;

  @Field(() => CoinMD, { nullable: true })
  coinMD?: CoinMD;

  @Field(() => Sponsor, { nullable: true })
  sponsor?: Sponsor;

  @Field(() => Ancestry, { nullable: true })
  ancestry?: Ancestry;

  @Field(() => Binary, { nullable: true })
  binary?: Binary;

  @Field(() => [AffiliateLink])
  affiliateLinks: AffiliateLink[];

  @Field()
  uuid: string;

  @Field(() => UserCrypto, { nullable: true })
  crypto?: UserCrypto;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => [String], { nullable: true })
  threeForFreeUserIds?: string[];

  @Field({ nullable: true })
  isW9onFile: boolean;

  @Field({ nullable: true })
  payoutMethod?: string;

  @Field(() => ProPayAccount, { nullable: true })
  proPay?: ProPayAccount;

  @Field({ nullable: true })
  isBanned: boolean;

  @Field(() => [MobileDevice], { nullable: true, defaultValue: [] })
  public mobileDevices?: MobileDevice[];

  @Field(() => MaxlineUser, { nullable: true })
  maxlineUser?: MaxlineUser;

  @Field(() => W7GUser, { nullable: true })
  w7gUser?: W7GUser;

  @Field(() => GraphQLISODateTime, { nullable: true })
  birthDay?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  updatedAt?: Date;

  @Field(() => String)
  name(): string {
    return this.name();
  }

  constructor(
    uuid: string = '',
    firstName?: string,
    lastName?: string,
    username: string = '',
    email?: string,
    password?: string,
    active: boolean = true,
    affiliateLinks: AffiliateLink[] = [],
    clickFunnelsAffiliateUrls?: ClickFunnelsAffiliateUrl[],
    remoteLoginId?: string,
    isSubscribed?: boolean,
    phone?: string,
    roles?: string[],
    threeForFreeUserIds?: string[],
    stripe: StripeData = null,
    address: Address = null,
    sorAccount: SorAccountReference = null,
    isW9onFile: boolean = false,
    isBanned: boolean = false
  ) {
    this.uuid = uuid;
    this.firstName = firstName;
    this.lastName = lastName;
    this.username = username;
    this.email = email;
    this.password = password;
    this.active = active;
    this.affiliateLinks = affiliateLinks;
    this.clickFunnelsAffiliateUrls = clickFunnelsAffiliateUrls;
    this.remoteLoginId = remoteLoginId;
    this.isSubscribed = isSubscribed;
    this.phone = phone;
    this.roles = roles;
    this.threeForFreeUserIds = threeForFreeUserIds;
    this.stripe = stripe;
    this.address = address;
    this.sorAccount = sorAccount;
    this.isW9onFile = isW9onFile;
    this.isBanned = isBanned;
  }
}
