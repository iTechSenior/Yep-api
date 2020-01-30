import { Context } from '@/helpers/interfaces';
import { Roles, verifyAccess, getAppSettings } from '@/helpers/utils';
import { QueryStatistics } from 'ravendb';
import { Resolver, Query, Ctx, Args, Arg, Mutation } from 'type-graphql';

import { AppSettings, AppSettingsCountryList, AppSettingsInput, CountryListItem, AppSettingsAddInput } from '@/types/appSettings';
import { VideoTag } from '@/types/video';
import { Country3DigitListItem } from '@/types/appSettings/Country3DigitListItem';
import { AppSettingsCountry3DigitList } from '@/types/appSettings/AppSettingsCountry3DigitList';
import { AppSettingsYepBannerList } from '@/types/appSettings/AppSettingsYepBannerList';
import { YepBanner } from '@/types/appSettings/YepBanner';

@Resolver(() => AppSettings)
export class AppSettingsResolver {
  // #region Queries
  @Query(() => AppSettings)
  async getAppSettings(@Ctx() { session, req }: Context): Promise<AppSettings> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    return session.load<AppSettings>('appSettings/1-A');
  }

  @Query(() => [String])
  async getCategories(@Ctx() { session, req }: Context): Promise<string[]> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const appSettings = await session.load<AppSettings>('appSettings/1-A');
    return appSettings.categories;
  }

  @Query(() => [VideoTag])
  async getVideoTags(@Ctx() { session, req }: Context): Promise<VideoTag[]> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const appSettings = await session.load<AppSettings>('appSettings/1-A');
    return appSettings.tags;
  }

  @Query(() => [YepBanner])
  async getBanners(@Ctx() { session, req }: Context): Promise<YepBanner[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    return (await getAppSettings<AppSettingsYepBannerList>(session, 'Yep-Banners')).data;
  }

  @Query(() => [YepBanner])
  async getBannersForMobile(@Ctx() { session, req }: Context): Promise<YepBanner[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    return (await getAppSettings<AppSettingsYepBannerList>(session, 'Yep-Banners-Mobile')).data;
  }

  @Query(() => [String], { nullable: true })
  async getPlans(@Ctx() { session, req }: Context): Promise<string[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const appSettings = await session.load<AppSettings>('appSettings/1-A');
    // console.log('appSettings.plans', appSettings.plans);
    return appSettings.plans;
  }

  @Query(() => [Country3DigitListItem])
  async getCountries(@Ctx() { session, req }: Context): Promise<Country3DigitListItem[]> {
    return (await getAppSettings<AppSettingsCountry3DigitList>(session, 'CountryCodes-3-Digit')).data;
  }
  // #end region
  // //#regions mutations
  @Mutation(() => AppSettings)
  async addAppSettings(@Arg('args') args: AppSettingsAddInput, @Ctx() { session, req }: Context): Promise<AppSettings> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const appSettings: AppSettings = new AppSettings(null, args.categories);
    await session.store(appSettings);
    await session.saveChanges();
    return appSettings;
  }

  @Mutation(() => AppSettings)
  async editAppSettings(@Arg('args', () => AppSettingsInput) args: AppSettingsInput, @Ctx() { session, req }: Context): Promise<AppSettings> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const appSettings = await session
      .query<AppSettings>({ collection: 'appSettings' })
      .firstOrNull();
    if (!appSettings) {
      return null;
    }

    Object.assign(appSettings, { ...args });
    await session.saveChanges();
    return appSettings;
  }
}
