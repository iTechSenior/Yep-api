import Axios from 'axios';
import { ISorMember, ISorApiResponse, ISorClubs, IApiCredentials, ISorSsoLoginResponse } from './interfaces';
import { SorGetMemberApiResponse, SorCreateMemberRequest } from '@/types/sor';
import { Exception } from '@/types/exception';
import { assertResolveFunctionsPresent } from 'graphql-tools';
import { IDocumentSession } from 'ravendb';
import { User } from '@/types/user';
import { AppSettingsCountryList, AppSettings } from '../schema/types/appSettings';
import * as Utils from './utils';
import { some, find } from 'lodash';

// date_default_timezone_set('UTC'); // memberTEK uses UTC interally for all date/times

export const SorUrls = {
  production: {
    activateMemberUrl: 'https://api.saveonresorts.com/clubmembership/activatemember',
    createDefaultUrl: 'https://api.saveonresorts.com/clubmembership/createdefault',
    createDefaultUrlV2: 'https://api.saveonresorts.com/v2/clubmembership/CreateDefault',
    createPaidUrl: 'https://api.saveonresorts.com/clubmembership/createpaid',
    deactivateMemberUrl: 'https://api.saveonresorts.com/clubmembership/deactivatemember',
    getLoginUrl: 'https://api.saveonresorts.com/clubmembership/getlogintokennovalidation',
    getLoginUrlV2: 'https://api.saveonresorts.com/clubmembership/getlogintokennovalidation',
    getMembersV2: 'https://api.saveonresorts.com/clubmembership/getmembers',
    transferMembersV2: 'https://api.saveonresorts.com/clubmembership/transferuser',
  },
  development: {
    activateMemberUrl: 'https://api.saveonuat.com/clubmembership/activatemember',
    createDefaultUrl: 'https://api.saveonuat.com/clubmembership/createdefault',
    createDefaultUrlV2: 'https://api.saveonuat.com/v2/clubmembership/CreateDefault',
    createPaidUrl: 'https://api.saveonuat.com/clubmembership/createpaid',
    deactivateMemberUrl: 'https://api.saveonuat.com/clubmembership/deactivatemember',
    getLoginUrl: 'https://api.saveonuat.com/clubmembership/getlogintokennovalidation',
    getLoginUrlV2: 'https://api.saveonuat.com/clubmembership/getlogintokennovalidation',
    getMembersV2: 'https://api.saveonuat.com/clubmembership/getmembers',
    transferMembersV2: 'https://api.saveonuat.com/clubmembership/transferuser',
  },
};

export const SorClubs: ISorClubs = {
  TripValetPlus: {
    clubId: 11713,
    apiCredentials: {
      username: 'TripValet',
      password: 'hdosg6554fe45',
    },
    loginUrl: 'https://members.tripvalet.com/vacationclub/logincheck.aspx?Token=',
    subscriberTypePrefix: 5,
    userAccountTypeId: 5,
  },
  TripValetVip: {
    clubId: 12009,
    apiCredentials: {
      username: 'TripValet297',
      password: '741gnfvqwer96',
    },
    loginUrl: 'https://members297.tripvalet.com/vacationclub/logincheck.aspx?Token=',
    subscriberTypePrefix: 1,
    userAccountTypeId: 1,
  },
  TripValetBoomerang: {
    clubId: 12032,
  },
  CiceroTravelPlus: {
    clubId: 12651,
    apiCredentials: {
      username: 'CiceroTravelPlus',
      password: 'ygvfed89psa43',
    },
    loginUrl: 'https://plus.cicerotravel.com/vacationclub/logincheck.aspx?Token=',
    subscriberTypePrefix: 5,
    userAccountTypeId: 5,
  },
  CiceroTravelVip: {
    clubId: 12652,
    apiCredentials: {
      username: 'CiceroTravelPro',
      password: 'qsdpr94xz27',
    },
    loginUrl: 'https://vip.cicerotravel.com/vacationclub/logincheck.aspx?Token=',
    subscriberTypePrefix: 1,
    userAccountTypeId: 1,
  },
  CiceroTravelBoomerang: {
    clubId: 12653,
    apiCredentials: {
      username: 'CiceroBoomerang',
      password: 'gswx841hkv97',
    },
    loginUrl: 'https://refer.cicerotravelgo.com/vacationclub/logincheck.aspx?Token=',
  },
};

export const sorTransferMemberFromPlusToViP = async (email: string): Promise<any> => {
  const payload = {
    APIUsername: SorClubs.TripValetVip.apiCredentials.username,
    APIPassword: SorClubs.TripValetVip.apiCredentials.password,
    NewClubID: SorClubs.TripValetVip.clubId,
    SORContractNumber: '',
    SORMemberEmail: email,
    SORMemberID: -1,
  };

  try {
    const response = await Axios.post(SorUrls.production.transferMembersV2, payload);
    if (response.status === 200 && response.data === '') {
      return true;
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const sorTransferMemberFromVipToPlus = async (email: string): Promise<any> => {
  const payload = {
    APIUsername: SorClubs.TripValetPlus.apiCredentials.username,
    APIPassword: SorClubs.TripValetPlus.apiCredentials.password,
    NewClubID: SorClubs.TripValetPlus.clubId,
    SORContractNumber: '',
    SORMemberEmail: email,
    SORMemberID: -1,
  };

  try {
    const response = await Axios.post(SorUrls.production.transferMembersV2, payload);
    if (response.status === 200 && response.data === '') {
      return true;
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const sorTransferMemberFromBoomerangToVip = async (email: string): Promise<any> => {
  const payload = {
    APIUsername: SorClubs.TripValetVip.apiCredentials.username,
    APIPassword: SorClubs.TripValetVip.apiCredentials.password,
    NewClubID: SorClubs.TripValetVip.clubId,
    SORContractNumber: '',
    SORMemberEmail: email,
    SORMemberID: -1,
  };

  try {
    const response = await Axios.post(SorUrls.production.transferMembersV2, payload);
    if (response.status === 200 && response.data === '') {
      return true;
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const sorTransferMemberFromBoomerangToPlus = async (email: string): Promise<any> => {
  const payload = {
    APIUsername: SorClubs.TripValetPlus.apiCredentials.username,
    APIPassword: SorClubs.TripValetPlus.apiCredentials.password,
    NewClubID: SorClubs.TripValetPlus.clubId,
    SORContractNumber: '',
    SORMemberEmail: email,
    SORMemberID: -1,
  };

  try {
    const response = await Axios.post(SorUrls.production.transferMembersV2, payload);
    if (response.status === 200 && response.data === '') {
      return true;
    } else {
      throw new Error(response.data);
    }
  } catch (ex) {
    throw ex;
  }
};

export const sorGetMemberByEmail = async (apiCredentials: IApiCredentials, email: string): Promise<SorGetMemberApiResponse> => {
  const payload = {
    APIUsername: apiCredentials.username,
    APIPassword: apiCredentials.password,
    MemberSearchList: [{ Email: email }],
    MaxCount: 1,
  };

  try {
    const response = await Axios.post<ISorMember[]>(SorUrls.production.getMembersV2, payload);
    if (response.status === 200) {
      // console.log(response);
      return { success: true, sorMember: response.data[0] };
    } else {
      throw new Error(`Failed to find Member by Email: ${email}`);
    }
  } catch (ex) {
    throw ex;
  }
};

export const sorSsoLogin = async (apiCredentials: IApiCredentials, email: string): Promise<ISorSsoLoginResponse> => {
  const payload = {
    APIUsername: apiCredentials.username,
    APIPassword: apiCredentials.password,
    Email: email,
  };

  try {
    const response = await Axios.post<any>(SorUrls.production.getLoginUrlV2, payload);
    if (response.status === 200) {
      if (typeof response.data === 'string') {
        return { success: true, token: response.data.replace('LoginToken:', '') }; // response.data;
      } else {
        throw new Error(`Unexpected Response: ${JSON.stringify(response.data)}`);
      }
    } else {
      throw new Error(`Failed to login Member by Email: ${email}`);
    }
  } catch (ex) {
    throw new Error(ex.response.data);
  }
};

export const ssoLoginCheckUrl = async (session: IDocumentSession, user: User): Promise<string> => {
  const apiCredentials = sorGetApiCredentials(user.roles);
  await sorCreateMemberIfNeeded(apiCredentials, session, user);
  const response: ISorSsoLoginResponse = await sorSsoLogin(apiCredentials, user.email);
  if (response.success) {
    return response.token;
  } else {
    return '';
  }
};

export const getCiceroUrl = (token: string, roles: string[], path: string): string => {
  if (path) {
    return `${sorGetCiceroLoginUrl(roles)}${token}&RedirectURL=%2F${path}%2F`;
  }
  return `${sorGetCiceroLoginUrl(roles)}${token}`;
};

export const sorGetCiceroLoginUrl = (roles: string[]): string => {
  if (
    some(roles, (role: string) => {
      return role === Utils.Roles.CiceroGO;
    })
  ) {
    return SorClubs.CiceroTravelBoomerang.loginUrl;
  }

  return some(roles, (role: string) => {
    // console.log('role', role === Roles.CiceroPlus);
    return role === Utils.Roles.CiceroPlus;
  })
    ? SorClubs.CiceroTravelPlus.loginUrl
    : SorClubs.CiceroTravelVip.loginUrl;
};

export const sorCreateMember = async (session: IDocumentSession, apiCredentials: IApiCredentials, user: User): Promise<ISorApiResponse> => {
  const config = {
    headers: {
      'x-saveon-username': apiCredentials.username,
      'x-saveon-secret': apiCredentials.password,
    },
  };

  try {
    const countries = <AppSettingsCountryList>(<unknown>await session.load<AppSettings>('AppSettings/CountryList'));
    let phone = user.phone;
    if (!phone) phone = '5551231234';
    let twoCharacterCountry = countries
      ? find(countries.data, country => {
          return country.name === user.address.country;
        })
      : { code: 'US' };
    if (!twoCharacterCountry) twoCharacterCountry = { code: 'US' };

    const sorRequest = new SorCreateMemberRequest(
      user.email,
      `${Utils.getSorPrefix(user.roles)}-${user.uuid}`,
      user.address.address,
      user.address.city,
      user.address.state,
      user.address.zip,
      twoCharacterCountry.code,
      user.phone,
      user.password,
      user.firstName,
      user.lastName,
      sorGetUserAccountTypeId(user.roles)
    );

    const response = await Axios.post<ISorApiResponse>(SorUrls.production.createDefaultUrlV2, sorRequest, config);
    return response.data;
  } catch (ex) {
    throw ex;
  }
};

export const sorDeactivateMember = async (apiCredentials: IApiCredentials, email: string, contractNumber: string): Promise<boolean> => {
  const payload = {
    APIUsername: apiCredentials.username,
    APIPassword: apiCredentials.password,
    Email: email,
    ContractNumber: contractNumber,
    ChangeNote: 'Payment Failed or Past Due',
  };

  try {
    const response = await Axios.post<any>(SorUrls.production.deactivateMemberUrl, payload);
    if (response.status === 200) {
      return true;
    } else {
      throw new Error(`Failed to deactivate Member by Email: ${email}`);
    }
  } catch (ex) {
    throw new Error(ex.response.data);
  }
};

export const sorActivateMember = async (apiCredentials: IApiCredentials, email: string, contractNumber: string): Promise<boolean> => {
  const payload = {
    APIUsername: apiCredentials.username,
    APIPassword: apiCredentials.password,
    Email: email,
    ContractNumber: contractNumber,
    ChangeNote: 'The User has paid the subscription fees',
  };

  try {
    const response = await Axios.post<any>(SorUrls.production.activateMemberUrl, payload);
    if (response.status === 200) {
      return true;
    } else {
      throw new Error(`Failed to activate Member by Email: ${email}`);
    }
  } catch (ex) {
    throw new Error(ex.response.data);
  }
};

export const sorCreateMemberIfNeeded = async (apiCredentials: IApiCredentials, session: IDocumentSession, user: User): Promise<boolean> => {
  try {
    if (
      !user.sorAccount &&
      some(user.roles, role => {
        return (
          role === Utils.Roles.TVPlus ||
          role === Utils.Roles.TVVip ||
          role === Utils.Roles.CiceroPlus ||
          role === Utils.Roles.CiceroVip ||
          role === Utils.Roles.CiceroGO
        );
      })
    ) {
      const sorMember = await sorGetMemberByEmail(apiCredentials, user.email);
      if (!sorMember.success || (sorMember.success && !sorMember.sorMember)) {
        const response = await sorCreateMember(session, apiCredentials, user);
        if (response.ResultType !== 'success') {
          await session.store(
            await Utils.createAndSendException(
              null,
              new Error(response.Message).stack,
              `Attempting to Create User in SOR ${response.Message}`,
              { response, apiCredentials, user },
              true
            )
          );
          await session.saveChanges();
        } else {
          user.sorAccount = {
            contractNumber: user.id,
            userId: response.Account.UserId,
          };
          await session.saveChanges();
        }
      } else {
        user.sorAccount = {
          contractNumber: user.id,
          userId: sorMember.sorMember.UserID,
        };
        await session.saveChanges();
      }
    }
    return null;
  } catch (ex) {
    await session.store(
      await Utils.createAndSendException(
        null,
        new Error(ex.message).stack,
        ex.message,
        {
          location: {
            function: 'helpers > sor.ts > sorCreateMemberIfNeeded()',
          },
          user,
        },
        true
      )
    );
    await session.saveChanges();
  }
};

export const sorGetApiCredentials = (roles: string[]) => {
  return some(roles, role => {
    return role === Utils.Roles.TVPlus;
  })
    ? SorClubs.TripValetPlus.apiCredentials
    : SorClubs.TripValetVip.apiCredentials;
};

export const sorGetLoginUrl = (roles: string[]) => {
  return some(roles, role => {
    return role === Utils.Roles.TVPlus;
  })
    ? SorClubs.TripValetPlus.loginUrl
    : SorClubs.TripValetVip.loginUrl;
};

export const sorGetUserAccountTypeId = (roles: string[]) => {
  return some(roles, role => {
    return role === Utils.Roles.TVPlus;
  })
    ? SorClubs.TripValetPlus.userAccountTypeId
    : SorClubs.TripValetVip.userAccountTypeId;
};

export interface ISorCreateMemberRequest {
  Email: string;
  ContractNumber: string;
  Address: string;
  City: string;
  State: string;
  PostalCode: string;
  TwoLetterCountryCode: string;
  Phone: string;
  Password: string;
  FirstName: string;
  LastName: string;
  UserAccountTypeID: number;
}

const sorLanguages = {
  English: 1,
  Spanish: 2,
  French: 3,
  Portuguese: 4,
  German: 5,
  Italian: 6,
  Russian: 7,
  Dutch: 8,
  Filipino: 9,
  Mandarin: 10,
  Cantonese: 11,
  Japanese: 12,
  Thai: 13,
  Vietnamese: 14,
  Korean: 15,
  Arabic: 16,
  Hindi: 17,
  Punjabi: 18,
  Albanian: 19,
  Armenian: 20,
  Bangla: 21,
  Greek: 22,
  Swahili: 23,
  Afrikaans: 24,
  Turkish: 25,
  Czech: 26,
  Croatian: 27,
  Hungarian: 28,
  Creole: 29,
  Kazak: 30,
  Latvian: 31,
  Macedonian: 32,
  Maltese: 33,
  Persian: 34,
  Mongolian: 35,
  Burmese: 36,
  Nepali: 37,
  Polish: 38,
  Samoan: 39,
  Hebrew: 40,
  Somali: 41,
  Ukranian: 42,
  Latin: 43,
  Uzbek: 44,
  Azeri: 45,
  Indonesian: 46,
  Danish: 47,
  Catalan: 48,
  Swedish: 49,
  Scandinavian: 50,
  Norwegian: 51,
  Finnish: 52,
  Bulgarian: 53,
  Malay: 54,
  Romanian: 55,
  Slovak: 56,
  Slovenian: 57,
  Estonian: 58,
  Lithuanian: 59,
  Icelandic: 60,
  'English GB': 61,
};
