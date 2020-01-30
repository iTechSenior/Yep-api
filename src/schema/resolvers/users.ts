import { Context, ISorSsoLoginResponse } from '@/helpers/interfaces';
import zipcodes from 'zipcodes';
import {
  Roles,
  verifyAccess,
  formatSearchTerm,
  getNowUtc,
  createAndSendException,
  isUsernameExcluded,
  isUsernameTaken,
  isEmailTaken,
  sendPasswordReset,
} from '@/helpers/utils';
import { QueryStatistics } from 'ravendb';
import { Resolver, Query, Ctx, Args, Arg, Mutation, FieldResolver, Root } from 'type-graphql';
import { DateTime } from 'luxon';
import { v4 as uuidV4 } from 'uuid';
import * as jwt from 'jsonwebtoken';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import {
  User,
  MeResponse,
  UserCount,
  LoginArgs,
  LoginResponse,
  UserInput,
  UpdatePasswordInput,
  UpdateAccountArgs,
  PasswordResetToken,
  SAMLResponse,
  PlacementResponse,
} from '@/types/user';
import { Address } from '@/types/address';
import { EscapeBucksByUserId } from '@/types/escapeBuck';
import { HealthCheck } from '@/types/healthCheck';
import { BooleanResponse } from '@/types/common/BooleanResponse';
import { RegisterAndSubscribeArgs } from '@/types/funnel/RegisterAndSubscribeInput';
import { PaymentAccountEnum } from '@/types/Enums';
import * as userHelper from '@/helpers/user';
import { RegisterAndSubscribeResponse } from '@/types/funnel/RegisterAndSubscribeResponse';
import { ResetPasswordArgs } from '@/types/user/ResetPasswordInput';
import { RegisterAndSubscribeYepArgs } from '@/types/funnel/RegisterAndSubscribeYepArgs';
import { DumpBucket } from '@/types/dumpBucket';
import { sorSsoLogin, sorCreateMemberIfNeeded, sorGetApiCredentials, sorGetLoginUrl, ssoLoginCheckUrl, getCiceroUrl } from '@/helpers/sor';
import { SorLoginResponse, GetCiceroUrlInput } from '@/types/sor';
import { APIMessageResponse } from '@/types/common';
import { ApolloError } from 'apollo-server-core';
import { ContactEmailsResolver } from './contactEmails';
import { UpgradeMembershipYepArgs } from '@/types/funnel';
import { PromoCode } from '@/types/funnel/PromoCode';
const { sp, idp, createTemplateCallback } = require('../../helpers/benefithub');
import { initializeStore } from '@/db/index';
import { YepCommission, YepCompensationSideArgs, YepHoldingTankList, YepAllHoldingTankList } from '@/types/yepCommission';
import { YepHoldingUser } from '@/types/yepCommission/YepHoldingUser';
import { getPreviousDayOfWeek, getNextDayOfWeek } from '@/helpers/stripe';
import moment from 'moment';
import { YepCutoff, YepCutoffList } from '@/types/yepCutoff';
import { HighlightingToken } from 'ravendb/dist/Documents/Session/Tokens/HighlightingToken';

@Resolver(() => User)
export class UserResolver {
  //#region Queries

  @Query(() => MeResponse)
  async me(@Ctx() { session, req }: Context): Promise<MeResponse> {
    const dumpBucket = new DumpBucket(null, 'Me > Request', {
      user: req.user,
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      hostname: req.hostname,
      headers: req.headers,
    });
    await session.store(dumpBucket);
    await session.saveChanges();

    if (req.user) {
      const roleLevel = userHelper.getProductFromUserRoles(req.user.roles, [Roles.TVIBasic, Roles.TVIPlus, Roles.TVIPro]);

      const threeForFree = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('sponsorId', req.user.id)
        .whereEquals('active', true)
        .whereIn('roles', [roleLevel])
        .count();

      const escapeBucks: EscapeBucksByUserId = await session
        .query<EscapeBucksByUserId>({ indexName: 'TotalEscapeBucksByUserId' })
        .whereEquals('userId', req.user.id)
        .firstOrNull();

      const user: User = await session.load<User>(req.user.id);
      if (!user.address) {
        user.address = new Address('', '', '', '', 'United States');
        await session.saveChanges();
      }

      return { user, threeForFreeCount: threeForFree, escapeBucks: escapeBucks ? escapeBucks.bucks : 0 };
    } else return { user: null, threeForFreeCount: 0, escapeBucks: 0 };
  }

  @Query(() => UserCount)
  async users(@Args() { skip, pageSize, searchText }: TablePaginationWithSearchTextArgs, @Ctx() { session }: Context): Promise<UserCount> {
    // verifyAccess(req, [Roles.Administrator]);
    let stats: QueryStatistics;
    const userQuery = session
      .query<User>({ indexName: 'Users' })
      .statistics(s => (stats = s))
      .skip(skip)
      .take(pageSize);
    if (searchText) {
      userQuery.search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }
    const users: User[] = await userQuery.all();
    return { users: users, totalRows: stats.totalResults };
  }

  @Query(() => User)
  async userById(@Arg('id') id: string, @Ctx() { session }: Context): Promise<User> {
    // verifyAccess(req, [Roles.Administrator]);
    return session.load<User>(id);
  }

  @Query(() => User, { nullable: true })
  async userByUserName(@Arg('userName') userName: string, @Ctx() { session }: Context): Promise<User> {
    // verifyAccess(req, [Roles.Administrator]);
    return session
      .query<User>({ indexName: 'Users' })
      .whereEquals('username', userName)
      .firstOrNull();
  }

  @Query(() => SAMLResponse)
  async getSAML(@Ctx() { session, req }: Context): Promise<SAMLResponse | any> {
    return new Promise(async (resolve, reject) => {
      if (req.user) {
        const user = await session.load<User>(req.user.id);
        const firstName = user.firstName;
        const lastName = user.lastName;
        const email = user.email;
        const zipCode = user.address.zip;
        const orgId = process.env.NODE_ENV === 'development' ? process.env.BENEFITHUB_TEST_ORGID : process.env.BENEFITHUB_PRODUCTION_ORGID;

        const userAttribute = {
          orgId,
          firstName,
          lastName,
          email,
          zipCode,
        };

        const { id, context } = await idp.createLoginResponse(sp, req, 'post', userAttribute, createTemplateCallback(idp, sp, userAttribute), true);

        const info = new DumpBucket(null, 'SAML Login Response Variables', {
          userAttribute,
          id,
          template: createTemplateCallback(idp, sp, userAttribute),
          context,
          reqUser: req.user,
          sp,
        });
        await session.store(info);
        await session.saveChanges();

        resolve({ samlResponse: context });
      } else {
        reject();
      }
    });
  }

  // //#endregion
  // //#region Mutations

  @Mutation(() => LoginResponse)
  async login(@Args() { email, password, uuid }: LoginArgs, @Ctx() { session, req }: Context): Promise<LoginResponse> {
    try {
      const dumpBucket = new DumpBucket(null, 'Login > Request > Headers and Urls', {
        user: req.user,
        url: req.url,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
        hostname: req.hostname,
        headers: req.headers,
      });
      await session.store(dumpBucket);
      await session.saveChanges();

      const user: User = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('email', email)
        .whereEquals('active', true)
        .firstOrNull();

      if (!user) {
        throw new ApolloError('Email and/or Password is invalid');
      }

      if (password !== user.password) {
        throw new ApolloError('Email and/or Password is invalid');
      }

      user.updatedAt = DateTime.utc().toJSDate();
      if (uuid) {
        if (!user.mobileDevices) user.mobileDevices = [];
        user.mobileDevices = [...user.mobileDevices, { deviceId: uuid }];
      }
      await session.saveChanges();

      const token = jwt.sign({ id: user.id, roles: user.roles, userName: user.username }, process.env.JWT_SECRET_KEY, {
        expiresIn: '18h',
      });

      // Add this for any Restful API Call
      req['user'] = {
        id: user.id,
        roles: user.roles,
        userName: user.username,
      };

      // console.log('user', user, token);
      return {
        user,
        token,
      };
    } catch (ex) {
      // console.log('ex', ex.message);
      throw new ApolloError(ex.message);
    }
  }

  @Mutation(() => LoginResponse)
  async loginWithBiometrics(@Arg('uuid') uuid: string, @Ctx() { session, req }: Context): Promise<LoginResponse> {
    const user = await session
      .query<User>({ indexName: 'Users' })
      .whereEquals('mobileDeviceIds', uuid)
      .firstOrNull();

    if (!user) {
      throw new Error('Email and/or Password is invalid');
    }

    user.updatedAt = DateTime.utc().toJSDate();
    await session.saveChanges();

    const token = jwt.sign({ id: user.id, roles: user.roles }, process.env.JWT_SECRET_KEY, {
      expiresIn: '18h',
    });

    return {
      user,
      token,
    };
  }

  @Mutation(() => User)
  async saveUser(@Arg('data', () => UserInput) data: UserInput, @Ctx() { session }: Context): Promise<User> {
    // [Roles.Administrator]);
    const entity: User = await User.fromUserInput(session, data);
    await session.store<User>(entity);
    await session.saveChanges();
    return entity;
  }
  // #endregion

  // #region Field Resolvers
  @FieldResolver(() => String)
  name(@Root() user: User) {
    return `${user.firstName} ${user.lastName}`;
  }
  //#endregion

  @Mutation(() => User)
  async updatePassword(@Arg('data', () => UpdatePasswordInput) data: UpdatePasswordInput, @Ctx() { session, req }: Context): Promise<User> {
    verifyAccess(req, [
      Roles.TVPlus,
      Roles.TVVip,
      Roles.TVIPlus,
      Roles.TVIPro,
      Roles.TVIBasic,
      Roles.CoinMD,
      Roles.Administrator,
      Roles.Corporate,
      Roles.Developer,
      Roles.Affiliate,
    ]);
    const { currentPassword, newPassword } = data;
    const me = await session.load<User>(req.user.id);
    if (currentPassword !== me.password) {
      throw new Error('Current Password is Incorrect.');
    }
    me.password = newPassword;
    me.updatedAt = getNowUtc();
    await session.saveChanges();
    return me;
  }

  @Mutation(() => BooleanResponse)
  async resetPassword(@Args() { resetToken, newPassword }: ResetPasswordArgs, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const healthCheck = new HealthCheck(null, null, { headers: req.headers, body: req.body });
    await session.store(healthCheck);
    await session.saveChanges();

    let user: User = null;
    try {
      user = await session
        .query<User>({ collection: 'Users' })
        .whereEquals('resetToken', resetToken)
        .singleOrNull();
      // const cryptPassword = await bcrypt.hash(newPassword, 10);
      user.password = newPassword;
      user.updatedAt = getNowUtc();
      await session.saveChanges();
      return { success: true };
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, { resetToken, newPassword, user }));
      await session.saveChanges();
      throw new Error('Unable to locate account by Reset Token.');
    }
  }

  @Mutation(() => User)
  async editMe(@Args() args: UpdateAccountArgs, @Ctx() { session, req }: Context): Promise<User> {
    // verifyAccess(req, [
    //   Roles.TVIPro,
    //   Roles.TVIPlus,
    //   Roles.TVIBasic,
    //   Roles.Corporate,
    //   Roles.Administrator,
    //   Roles.Developer,
    //   Roles.TVPlus,
    //   Roles.TVVip,
    //   Roles.Affiliate,
    //   Roles.CoinMD,
    // ]);

    const { password, ...rest } = args;
    const username = args.username.replace(/\s/g, '');
    if (isUsernameExcluded(username) || (await isUsernameTaken(session, req.user.id, username))) {
      throw new Error('Username not available');
    }
    if (await isEmailTaken(session, req.user.id, args.email)) {
      throw new Error('Email already exists');
    }

    const me = await session.load<User>(req.user.id);

    if (args.password && args.password !== me.password) {
      throw new ApolloError('Password is incorrect');
    }

    Object.assign(me, { ...args }, { username, updatedAt: getNowUtc() });
    Object.assign(me, { ...rest }, { username, updatedAt: getNowUtc() });
    await session.saveChanges();
    return me;
  }

  @Mutation(() => BooleanResponse)
  async forgotPassword(@Arg('email') email: string, @Ctx() { session }: Context): Promise<BooleanResponse> {
    try {
      const user = await session
        .query<User>({ collection: 'Users' })
        .whereEquals('email', email)
        .singleOrNull();
      if (!user) throw new Error('Unable to locate account by the email you entered.');
      const token = uuidV4();
      user.resetToken = token;
      const expiresAt: Date = new Date(new Date().getTime() + 10 * 60000);
      const passwordResetTokenId: string = token;
      const passwordResetToken = new PasswordResetToken(passwordResetTokenId, user.id);
      await session.store(passwordResetToken);
      const metadata = session.advanced.getMetadataFor(passwordResetToken);
      metadata['@expires'] = expiresAt.toISOString();
      user.updatedAt = getNowUtc();
      await session.saveChanges();
      sendPasswordReset(user, token);
      return { success: true };
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, email));
      await session.saveChanges();
      throw new Error('Unable to locate account by email entered.');
    }
  }

  @Mutation(() => RegisterAndSubscribeResponse)
  async registerAndSubscribe(@Args() args: RegisterAndSubscribeArgs, @Ctx() { session }: Context): Promise<RegisterAndSubscribeResponse> {
    return userHelper.registerAndSubscribe(session, args, PaymentAccountEnum.TripValetLLC);
  }

  @Mutation(() => RegisterAndSubscribeResponse)
  async registerAndSubscribeMotivated(@Args() args: RegisterAndSubscribeArgs, { session }: Context) {
    return userHelper.registerAndSubscribe(session, args, PaymentAccountEnum.GetMotivated);
  }

  @Mutation(() => RegisterAndSubscribeResponse)
  async registerAndSubscribeIncentives(@Args() args: RegisterAndSubscribeArgs, { session }: Context) {
    return userHelper.registerAndSubscribe(session, args, PaymentAccountEnum.TripValetIncentives);
  }

  @Mutation(() => RegisterAndSubscribeResponse)
  async registerAndSubscribeYep(@Args() args: RegisterAndSubscribeYepArgs, @Ctx() { session }: Context): Promise<RegisterAndSubscribeResponse> {
    return userHelper.registerAndSubscribeYep(session, args, PaymentAccountEnum.YepWonder7Global);
  }

  @Mutation(() => RegisterAndSubscribeResponse)
  async upgradeMembership(@Args() args: UpgradeMembershipYepArgs, @Ctx() { session }: Context): Promise<RegisterAndSubscribeResponse> {
    return userHelper.upgradeMembership(session, args);
  }
  // SOR stuff
  @Mutation(() => SorLoginResponse)
  async ssoLogin(@Ctx() { req, session }: Context): Promise<SorLoginResponse> {
    try {
      const user: User = await session.load<User>(req.user.id);
      if (user) {
        const email: string = user.email;
        const apiCredentials = sorGetApiCredentials(user.roles);
        // const email: string = 'demo297@tripvalet.com';
        await sorCreateMemberIfNeeded(apiCredentials, session, user);
        const response: ISorSsoLoginResponse = await sorSsoLogin(apiCredentials, email);
        if (response.success) {
          return { success: true, url: `${sorGetLoginUrl(user.roles)}${response.token}` };
        } else {
          return { success: false, message: 'Email or Password Invalid' };
        }
      } else {
        return { success: false, message: 'There is no such user.' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  @Mutation(() => APIMessageResponse)
  async getCiceroUrl(@Args() { path }: GetCiceroUrlInput, @Ctx() { session, req }: Context): Promise<APIMessageResponse> {
    // verifyAccess(req, [Roles.CiceroPlus, Roles.CiceroVip, Roles.CiceroGO]);
    const user = await session.load<User>(req.user.id);

    const token = await ssoLoginCheckUrl(session, user);
    const url: string = getCiceroUrl(token, user.roles, path);
    return { message: url, success: true };
  }

  @Mutation(() => String)
  async getMibSsoUrl(@Ctx() { session, req }: Context): Promise<string> {
    verifyAccess(req, null);
    const user = await session.load<User>(req.user.id);
    if (user) {
      const mibCredentials = `${process.env.MIB_KEY}:${process.env.MIB_SECRET}`;
      const mibCredentialsBuffer = Buffer.from(mibCredentials);
      const mibAuthorization = `Basic ${mibCredentialsBuffer.toString('base64')}`;

      const payload = {
        action: 'sso',
        yep_id: user.uuid,
        authorization: mibAuthorization,
      };
      const mibRequestBuffer = Buffer.from(JSON.stringify(payload));
      return `https://myyeptribe.com/api/2.0/sso/?data=${mibRequestBuffer.toString('base64')}`;
    }
    return '';
  }

  @Query(() => UserCount)
  async getLocalYepTribes(@Arg('zip') zip: string, @Ctx() { session, req }: Context): Promise<UserCount> {
    const location = zipcodes.lookup(zip);
    if (!location) {
      return { users: [], totalRows: 0 };
    }
    let stats: QueryStatistics;
    const users = await session
      .query<User>({ indexName: 'Users' })
      .containsAny('roles', [Roles.YEPLocal])
      .whereNotEquals('id', req.user.id)
      .statistics(s => (stats = s))
      .spatial('coordinates', f => f.withinRadius(450, location.latitude, location.longitude))
      .orderByDistance('coordinates', location.latitude, location.longitude)
      .all();

    return { users, totalRows: stats.totalResults };
  }

  @Query(() => YepHoldingTankList)
  async getHoldingTankList(
    @Args() { skip, pageSize, searchText }: TablePaginationWithSearchTextArgs,
    @Ctx() { req, session }: Context
  ): Promise<YepHoldingTankList> {
    // verifyAccess(req, [Roles.Administrator]);
    const myId = req.user.id;
    let stats: QueryStatistics;
    const userQuery = session
      .query<YepCommission>({ collection: 'YepCommissions' })
      .whereEquals('sponsorId', myId)
      .andAlso()
      .whereEquals('type', 'Initial')
      .statistics(s => (stats = s))
      .skip(skip)
      .take(pageSize);
    if (searchText) {
      userQuery.search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const commissions: YepCommission[] = await userQuery.all();
    const holdingUsers: YepHoldingUser[] = [];

    // for (const commission of commissions) {
    //   const user: User = await session.load<User>(commission.userId);
    //   if (user) {
    //     const name = user.firstName + ' ' + user.lastName;
    //     const email = user.email;
    //     const id = commission.id;
    //     const placement = commission.placement;

    //     holdingUsers.push(new YepHoldingUser(id, name, email, placement));
    //   }
    // }

    return { users: commissions, totalRows: commissions.length };
  }

  @Query(() => YepCutoffList)
  async getYepCutoffList(@Args() { skip, pageSize, searchText }: TablePaginationWithSearchTextArgs, @Ctx() { req, session }: Context): Promise<YepCutoffList> {
    // verifyAccess(req, [Roles.Administrator]);
    const myId = req.user.id;

    const t = new Date().getDate() + (6 - new Date().getDay() - 1) - 7 + 1;
    const lastFriday = new Date();
    lastFriday.setDate(t);
    lastFriday.setHours(0, 0, 0);

    let stats: QueryStatistics;
    const userQuery = session
      .query<YepCutoff>({ indexName: 'YepCutoffs' })
      .whereEquals('sponsorId', myId)
      .andAlso()
      .whereGreaterThanOrEqual('createdAt', lastFriday)
      .statistics(s => (stats = s))
      .skip(skip)
      .take(pageSize);
    if (searchText) {
      userQuery.search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const yepCutoffs: YepCutoff[] = await userQuery.all();

    return { users: yepCutoffs, totalRows: yepCutoffs.length };
  }

  @Query(() => YepAllHoldingTankList)
  async getAllHoldingTankList(
    @Args() { skip, pageSize, searchText }: TablePaginationWithSearchTextArgs,
    @Ctx() { req, session }: Context
  ): Promise<YepAllHoldingTankList> {
    // verifyAccess(req, [Roles.Administrator]);
    const myId = req.user.id;
    let stats: QueryStatistics;
    const userQuery = session
      .query<YepCommission>({ collection: 'YepCommissions' })
      .statistics(s => (stats = s))
      .skip(skip)
      .take(pageSize);
    if (searchText) {
      userQuery.search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const commissions: YepCommission[] = await userQuery.all();

    return { commissions: commissions, totalRows: commissions.length };
  }

  @Mutation(() => BooleanResponse)
  async setCompensationSide(@Args() { id, side }: YepCompensationSideArgs, @Ctx() { req, session }: Context): Promise<BooleanResponse> {
    const commission: YepCommission = await session.load<YepCommission>(id);
    if (commission) {
      commission.placement = side;

      await session.saveChanges();
      return { success: true };
    } else {
      return { success: false };
    }
  }

  @Query(() => PlacementResponse)
  async getDefaultPlacement(@Ctx() { req, session }: Context): Promise<PlacementResponse> {
    const myId = req.user.id;
    const user: User = await session.load<User>(myId);
    let placement: string = 'Right';
    if (user && user.w7gUser && user.w7gUser.defaultPlacement) {
      placement = user.w7gUser.defaultPlacement ? user.w7gUser.defaultPlacement : 'Right';
    }
    return { placement };
  }

  @Query(() => PlacementResponse)
  async getInstantPlacement(@Ctx() { req, session }: Context): Promise<PlacementResponse> {
    const myId = req.user.id;
    const user: User = await session.load<User>(myId);
    let isInstant = 'false';
    if (user && user.w7gUser) {
      isInstant = user.w7gUser.instantPlacement;
    }

    return { placement: isInstant };
  }

  @Mutation(() => BooleanResponse)
  async setDefaultPlacement(@Arg('placement') placement: string, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const user: User = await session.load<User>(req.user.id);
    if (user.w7gUser) {
      user.w7gUser.defaultPlacement = placement;
      await session.saveChanges();
      return { success: true };
    } else return { success: false };
  }

  @Mutation(() => BooleanResponse)
  async setInstantPlacement(@Arg('instant') instant: string, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const user: User = await session.load<User>(req.user.id);
    if (user.w7gUser) {
      user.w7gUser.instantPlacement = instant.toString();
      await session.saveChanges();
      return { success: true };
    } else return { success: false };
  }
}
