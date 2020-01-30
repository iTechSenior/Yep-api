import * as jwt from 'jsonwebtoken';
import * as express from 'express';
import sgMail from '@sendgrid/mail';
import * as gravatar from 'gravatar';
import * as Stripe from 'stripe';
import moment from 'moment';
import { find, some } from 'lodash';
import { IDocumentStore, IDocumentSession } from 'ravendb';
import { User } from '@/types/user';
import { MailData } from '@sendgrid/helpers/classes/mail';
import axios from 'axios';
import { Exception } from '@/types/exception';
import { htmlEncode } from 'js-htmlencode';
import { DateTime } from 'luxon';
import { Personalization } from '@sendgrid/helpers/classes';
import { Prospect, AuthorizeNetTransaction } from '@/types/prospect';
import { generateAffiliateLinks } from './user';
import { DateFilter } from '@/types/commission/DateFilter';
import { Card } from './interfaces';
import { Certificate } from '@/types/certificate';
import { ClassType } from 'type-graphql';
import { ClassMetadata } from 'type-graphql/dist/metadata/definitions';
import { ClassTypeResolver } from 'type-graphql/dist/decorators/types';
import { YepProspect } from '@/types/yepProspect';
import { JwtUser } from '@/types/JwtUser';
import short from 'short-uuid';
import striptags from 'striptags';

export const Roles = {
  Administrator: 'Administrator',
  Affiliate: 'Affiliate',
  Corporate: 'Corporate',
  CoinMD: 'CoinMD Member',
  Developer: 'Developer',
  Member: 'Member',
  TVIPro: 'TVI PRO',
  TVIPlus: 'TVI PLUS',
  TVIBasic: 'TVI BASIC',
  TVPlus: 'TV PLUS',
  TVVip: 'TV VIP',
  TVBoomerang: 'TV Boomerang',
  CiceroPlus: 'Cicero PLUS',
  CiceroVip: 'Cicero VIP',
  CiceroGO: 'Cicero GO',
  Maxline: 'Maxline',
  YEP: 'YEP',
  YEPBasic: 'YEP BASIC',
  YEPStarter: 'YEP STARTER',
  YEPBusiness: 'YEP BUSINESS',
  YEPFounder: 'YEP PRO',
  YEPLocal: 'YEP LOCAL',
  YEPTrainder: 'YEP TRAINER',
  ProPayMember: 'ProPay Member',
};

export const getUserId = ({ req }: Context) => {
  const Authorization = req.get('Authorization');
  if (Authorization) {
    const token = Authorization.replace('Bearer ', '');
    const { userId } = jwt.verify(token, process.env.JWT_SECRET_KEY) as { userId: string };
    return userId;
  }

  throw new AuthError();
};

export const verifyAccess = (req: CustomRequest, roles?: string[] | null) => {
  const { user } = req;
  if (!user) {
    throw new Error('Not Logged In');
  } else if (user && roles === null) {
    return true;
  } else if (user && !user.roles.some((r: string) => roles.indexOf(r) >= 0)) {
    throw new Error('Not Authorized');
  }
  return true;
};

export const isUsernameExcluded = (username: string): boolean => {
  const usernameExcludeList = [
    'members',
    'member',
    'corporate',
    'backoffice',
    'back-office',
    'support',
    'faq',
    'terms',
    'policies',
    'contact',
    'contact-us',
    'about',
    'about-us',
    'testimonies',
    'testimony',
    'testimonials',
    'affiliates',
    'affiliate',
    'sponsor',
    'sponsors',
    'login',
    'go',
    'tripvalet',
    'incentives',
  ];
  return usernameExcludeList.indexOf(username) >= 0 ? true : false;
};

export const isUsernameTaken = async (session: IDocumentSession, userId: string, username: string): Promise<boolean> => {
  if (isUsernameExcluded(username)) {
    return true;
  }

  return session
    .query<User>({ indexName: 'Users' })
    .whereEquals('username', username)
    .andAlso()
    .whereNotEquals('id', userId)
    .waitForNonStaleResults()
    .any();
};

export const isUsernameTakenByEmail = async (session: IDocumentSession, email: string, username: string): Promise<boolean> => {
  if (isUsernameExcluded(username)) {
    return true;
  }

  return session
    .query<User>({ indexName: 'Users' })
    .whereEquals('username', username)
    .andAlso()
    .whereNotEquals('email', email)
    .waitForNonStaleResults()
    .any();
};

export const getValidUsername = async (session: IDocumentSession, username: string): Promise<string> => {
  if (isUsernameExcluded(username)) {
    return `${username}-${new Date().getTime()}`;
  }

  const alreadyExists = await session
    .query<User>({ collection: 'Users' })
    .whereEquals('username', username)
    .waitForNonStaleResults()
    .any();

  if (alreadyExists) {
    return `${username}-${new Date().getTime()}`;
  }

  return username;
};

export const isEmailTaken = async (session: IDocumentSession, userId: string, email: string): Promise<boolean> => {
  return (await session
    .query<User>({ collection: 'Users' })
    .whereEquals('email', email)
    .andAlso()
    .whereNotEquals('id', userId)
    .waitForNonStaleResults()
    .count()) > 0
    ? true
    : false;
};

export const anyEmailTaken = async (session: IDocumentSession, email: string): Promise<boolean> => {
  return (await session
    .query<User>({ collection: 'Users' })
    .whereEquals('email', email)
    .waitForNonStaleResults()
    .count()) > 0
    ? true
    : false;
};

export const getNowUtc = () => {
  return DateTime.utc().toJSDate();
};

export const getUtcMomentByOffset = () => {
  return moment()
    .utc()
    .toISOString(true);
};

export class AuthError extends Error {
  constructor() {
    super('Not authorized');
  }
}

export const getSorPrefix = (roles: string[]) => {
  if (some(roles, role => (role.indexOf('YEP') >= 0 ? true : false))) return 'YEP';
  if (some(roles, role => (role.indexOf('Cicero') >= 0 ? true : false))) return 'CICERO';
  if (some(roles, role => (role.indexOf('TVI') >= 0 ? true : false))) return 'TVI';
  if (some(roles, role => (role.indexOf('TV') >= 0 ? true : false))) return 'TV';
  return 'NA';
};

export const sendInvitation = (prospect: Prospect, certificate: Certificate, user: User, ccUser = true) => {
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const templateData = {
    memberName: `${user.firstName} ${user.lastName}`,
    url: `https://incentives.tripvalet.com/gift/${prospect.uuid}`,
    redemptionUrl: certificate.redemptionUrl,
    year: new Date().getFullYear().toString(),
    title: certificate.title,
    destinations: certificate.destinations.toString(),
    certImageUrl: find(certificate.images, { type: 'Email', displayOrder: 1 }).url,
    message: prospect.personalizedMessage,
    expires: moment()
      .add(30, 'days')
      .format('MM/DD/YYYY'),
    photo:
      'https://marketing-image-production.s3.amazonaws.com/uploads/14080212826cb34f4a4eddc257c822db30a1696e19a266c82e301f5d76940e1486121e40c91ce160eaadc7c9a65aa6efde0d974b329befdf96217c0f828370b0.png',
    gravatarUrl,
  };

  if (certificate.sgTemplateId1) {
    let msg: any;
    msg = {
      from: {
        email: 'certificates@tripvaletincentives.com',
        name: 'TripValet Incentives',
      },
      //
      templateId: certificate.sgTemplateId1,
      personalizations: [
        {
          replyTo: user.email,
          to: prospect.deliveryEndpoint,
          bcc: ['troy.zarger@tripvalet.com'],

          dynamic_template_data: {
            subject: `${prospect.firstName}, A Gift for You: ${certificate.title}`,
            html: certificate.defaultMessage,
            ...templateData,
          },
        },
      ],
    };

    if (prospect.deliveryEndpoint !== user.email && ccUser) {
      msg.personalizations[0].cc = user.email;
    }

    if (process.env.NODE_ENV === 'development') {
      msg.personalizations[0].cc = null;
      msg.personalizations[0].bcc = null;
    }

    sgMail.send(msg);
    return { success: true };
  } else {
    try {
      sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
      const msg: MailData = {
        to: prospect.deliveryEndpoint,
        bcc: ['troy.zarger@tripvalet.com'],
        from: {
          email: 'certificates@tripvaletincentives.com',
          name: 'TripValet Incentives',
        },
        replyTo: user.email,
        subject: `${prospect.firstName}, A Gift for You: ${certificate.title}`,
        html: certificate.defaultMessage,
        templateId: 'd496e982-bd05-43c5-aaf9-51de95f0df96',
        substitutions: {
          ...templateData,
        },
      };

      if (prospect.deliveryEndpoint !== user.email && ccUser) {
        msg.cc = user.email;
      }

      if (process.env.NODE_ENV === 'development') {
        msg.cc = null;
        msg.bcc = null;
      }

      sgMail.send(msg);
      return { success: true };
    } catch (ex) {
      return { success: false };
    }
  }
};

export const sendYepInvitation = (args: YepProspect, user: User, ccUser = true) => {
  const yepCategories = ['Opportunity', 'Realtor', 'Insurance', 'Business Owner', 'Getting Paid to Give away Vacations', 'Travel Only Membership'];
  const yepEmailTemplates = [
    'd-ce1ae9d8b65c47b9a9d4569cccd8fa31',
    'd-71b7e3fef7094b75affcc9f89ca9ec8e',
    'd-76f4d94e08d54491b131253afe5a6d59',
    'd-737c2863e0584e1eabbec5f37fd6e783',
    'd-0b61e4e4abce40d29a3ae222f4665046',
    'd-656b9a4dd4754f58a9459d5b563af6bf',
  ];

  const getTemplateId = (category: string) => {
    const index = yepCategories.indexOf(category);

    if (index > -1) {
      return yepEmailTemplates[index];
    } else {
      return 'd-ce1ae9d8b65c47b9a9d4569cccd8fa31';
    }
  };
  const templateId = getTemplateId(args.categoryId);

  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const templateData = {
    memberName: `${user.firstName} ${user.lastName}`,
    memberFirstName: user.firstName,
    firstName: args.firstName,
    lastName: args.lastName,
    year: new Date().getFullYear().toString(),
    destinations: args.deliveryEndpoint,
    message: args.personalizedMessage,
    affiliateLink: `https://${user.username.toLowerCase()}.yeptribefreedom.com`,
    expires: moment()
      .add(30, 'days')
      .format('MM/DD/YYYY'),
    gravatarUrl,
  };

  let msg: any;
  msg = {
    from: {
      email: 'no-reply@yeptribe.com',
      name: 'YEP Tribe',
    },
    templateId,
    personalizations: [
      {
        replyTo: user.email,
        to: args.deliveryEndpoint,
        bcc: ['troy.zarger@tripvalet.com'],

        dynamic_template_data: {
          subject: `${args.firstName}, Welcome to YEP`,
          ...templateData,
        },
      },
    ],
  };

  if (args.deliveryEndpoint !== user.email && ccUser) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendCertificateLink = (prospect: Prospect, certificate: Certificate, user: User) => {
  try {
    const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
    const msg: MailData = {
      to: prospect.deliveryEndpoint,
      bcc: ['troy.zarger@tripvalet.com'],
      from: {
        email: 'certificates@tripvaletincentives.com',
        name: 'TripValet Incentives',
      },
      replyTo: user.email,
      subject: `${prospect.firstName}, A Gift for You: ${certificate.title}`,
      // text: 'Hello plain world!',
      html: certificate.defaultMessage,
      templateId: 'd-6820c2c4df44408fbf884525845b6788',
      substitutions: {
        memberName: `${user.firstName} ${user.lastName}`,
        url: certificate.assuredTravel.certificateTypeDescription, // <----------fix this
        year: new Date().getFullYear().toString(),
        title: certificate.title,
        destinations: certificate.destinations.toString(),
        certImageUrl: find(certificate.images, { type: 'Email', displayOrder: 1 }).url,
        message: prospect.personalizedMessage,
        expires: moment()
          .add(30, 'days')
          .format('MM/DD/YYYY'),
        photo:
          'https://marketing-image-production.s3.amazonaws.com/uploads/14080212826cb34f4a4eddc257c822db30a1696e19a266c82e301f5d76940e1486121e40c91ce160eaadc7c9a65aa6efde0d974b329befdf96217c0f828370b0.png',
        gravatarUrl,
      },
    };

    if (prospect.deliveryEndpoint !== user.email) {
      msg.cc = user.email;
    }
    if (process.env.NODE_ENV === 'development') {
      msg.cc = null;
      msg.bcc = null;
    }

    sgMail.send(msg);
    return { success: true };
  } catch (ex) {
    return { success: false };
  }
};

export const sendTripValetIncentivesWelcome = async (user: User, password: string, session: IDocumentSession) => {
  const links = await generateAffiliateLinks(user.id, session);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-9f916c862d804fbb80d6c8755dc8ae75',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: password,
          affiliate_links: links,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendYepWelcome = async (user: User, password: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  let msg: any;
  msg = {
    from: {
      email: 'no-reply@yeptribe.com',
      name: 'YEP Tribe',
    },
    templateId: 'd-ed1d6cd05c91421bbe55f5432fe6b036',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          {
            email: 'lorrell.winfield@wonder7global.com',
            name: 'Lorrell Winfield',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: password,
          customerLink: `https://${user.username}.yeptribefreedom.com/join`,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendYepCustomerOnlyWelcome = async (user: User, password: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  let msg: any;
  msg = {
    from: {
      email: 'support@yeptribe.com',
      name: 'YEP Tribes',
    },
    templateId: 'd-b66307c157a44308bc07672b75fe1dda',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: password,
          customerLink: `https://${user.username}.yeptribefreedom.com/join`,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendYepTravelCustomerOnlyWelcome = async (user: User, password: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  let msg: any;
  msg = {
    from: {
      email: 'support@yeptribe.com',
      name: 'YEP Tribes',
    },
    templateId: 'd-9c17a4f1f8074cd68d31cd8b3f9443b5',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: password,
          customerLink: `https://${user.username}.yeptribefreedom.com/join`,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendTripValetWelcome = async (user: User, password: string, session: IDocumentSession) => {
  const links = await generateAffiliateLinks(user.id, session);
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvalet.com',
      name: 'TripValet',
    },
    templateId: 'd-ee529f366cbb4db3aea6ec9fe846bf1f',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: password,
          affiliate_links: links,
        },
      },
    ],
  };
  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }
  sgMail.send(msg);
  return { success: true };
};

export const sendTripValetAffiliateWelcome = async (user: User) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvalet.com',
      name: 'TripValet',
    },
    templateId: 'd-eece8c4e0ae14ada98ddece69bc32dd9',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell'
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          email: user.email,
          password: user.password,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendAssuredTravelCertificateLink = (prospect: Prospect, user: User) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-6820c2c4df44408fbf884525845b6788',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          firstName: prospect.firstName,
          url: prospect.assuredTravel.registrationURL,
          trip: prospect.certificate.title,

          memberName: `${user.firstName} ${user.lastName}`,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendSfxCertificateLink = (prospect: Prospect, user: User, code: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: prospect.certificate.sgTemplateId2 ? prospect.certificate.sgTemplateId2 : 'd-6820c2c4df44408fbf884525845b6788',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          subject: `Activate Your ${prospect.certificate.title} Trip`,
          firstName: prospect.firstName,
          url: process.env.SFX_REDEEMURL,
          redemptionUrl: prospect.certificate.redemptionUrl,
          trip: prospect.certificate.title,
          code,

          memberName: `${user.firstName} ${user.lastName}`,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendLasVegasActivationOnlyReceipt = (prospect: Prospect, user: User, invoiceNumber: string, transaction: Stripe.charges.ICharge) => {
  const source = transaction.source as Card;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  const travelers: any[] = prospect.travelers.map(t => ({
    firstName: t.firstName,
    lastName: t.lastName,
    dateOfBirth: DateTime.fromJSDate(t.dateOfBirth)
      .toLocal()
      .toFormat('DD'),
    maritalStatus: t.maritalStatus,
  }));
  const preferredDates = {
    start: DateTime.fromJSDate(prospect.preferredDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.preferredDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  const alternateDates = {
    start: DateTime.fromJSDate(prospect.alternateDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.alternateDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-a661aaaeb39d48af9b5626b896f79810',

    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          {
            email: 'LVVbooking@yobovegas.com',
            name: 'Las Vegas Booking',
          },
          {
            email: 'operations@yobovegas.com',
            name: 'Operations',
          },
          {
            email: 'kristin@yobovegas.com',
            name: 'Kristin Tisnado',
          },
          {
            email: 'vegas@tripvaletincentives.com',
            name: 'Vegas Certificate Receipt',
          },
          {
            email: 'niki@tripvalet.com',
            name: 'Niki Ezzell',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          subject: 'Las Vegas Trip Activation Receipt',
          firstName: prospect.firstName,
          url: process.env.SFX_REDEEMURL,
          trip: prospect.certificate.title,

          invoiceNumber,
          transId: transaction.id,
          authCode: transaction.receipt_number,
          cardType: source.brand,
          cardNumber: source.last4,
          travelers,
          preferredDates,
          alternateDates,
          name: `${user.firstName} ${user.lastName}`,
          email: prospect.deliveryEndpoint,
          phone: prospect.phone,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendLasVegasActivationAndReservationReceipt = (prospect: Prospect, user: User, invoiceNumber: string, transaction: Stripe.charges.ICharge) => {
  const source = transaction.source as Card;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  const travelers: any[] = prospect.travelers.map(t => ({
    firstName: t.firstName,
    lastName: t.lastName,
    dateOfBirth: DateTime.fromJSDate(t.dateOfBirth)
      .toLocal()
      .toFormat('DD'),
    maritalStatus: t.maritalStatus,
  }));
  const preferredDates = {
    start: DateTime.fromJSDate(prospect.preferredDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.preferredDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  const alternateDates = {
    start: DateTime.fromJSDate(prospect.alternateDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.alternateDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-53baf8c8c87d4f66b2b9fc1b02c2b7c7',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          {
            email: 'LVVbooking@yobovegas.com',
            name: 'Las Vegas Booking',
          },
          {
            email: 'operations@yobovegas.com',
            name: 'Operations',
          },
          {
            email: 'kristin@yobovegas.com',
            name: 'Kristin Tisnado',
          },
          {
            email: 'niki@tripvalet.com',
            name: 'Niki Ezzell',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          subject: 'Las Vegas Trip Activation and Reservation Receipt',
          firstName: prospect.firstName,
          url: process.env.SFX_REDEEMURL,
          trip: prospect.certificate.title,

          invoiceNumber,
          transId: transaction.id,
          authCode: transaction.receipt_number,
          cardType: source.brand,
          cardNumber: source.last4,
          travelers,
          preferredDates,
          alternateDates,
          name: `${user.firstName} ${user.lastName}`,
          email: prospect.deliveryEndpoint,
          phone: prospect.phone,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendLasVegasReservationOnlyReceipt = (prospect: Prospect, user: User, invoiceNumber: string, transaction: Stripe.charges.ICharge) => {
  const source = transaction.source as Card;

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // sgMail.setSubstitutionWrappers('{{', '}}');
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  let msg: any;
  const travelers: any[] = prospect.travelers.map(t => ({
    firstName: t.firstName,
    lastName: t.lastName,
    dateOfBirth: DateTime.fromJSDate(t.dateOfBirth)
      .toLocal()
      .toFormat('DD'),
    maritalStatus: t.maritalStatus,
  }));
  const preferredDates = {
    start: DateTime.fromJSDate(prospect.preferredDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.preferredDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  const alternateDates = {
    start: DateTime.fromJSDate(prospect.alternateDates[0])
      .toLocal()
      .toFormat('DD'),
    end: DateTime.fromJSDate(prospect.alternateDates[1])
      .toLocal()
      .toFormat('DD'),
  };
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-04e9fed8a7264b1cacf63f3281b75f07',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          {
            email: 'LVVbooking@yobovegas.com',
            name: 'Las Vegas Booking',
          },
          {
            email: 'operations@yobovegas.com',
            name: 'Operations',
          },
          {
            email: 'kristin@yobovegas.com',
            name: 'Kristin Tisnado',
          },
          {
            email: 'niki@tripvalet.com',
            name: 'Niki Ezzell',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          subject: 'Las Vegas Trip Reservation Receipt',
          firstName: prospect.firstName,
          url: process.env.SFX_REDEEMURL,
          trip: prospect.certificate.title,

          invoiceNumber,
          transId: transaction.id,
          authCode: transaction.receipt_number,
          cardType: source.brand,
          cardNumber: source.last4,
          travelers,
          preferredDates,
          alternateDates,
          name: `${user.firstName} ${user.lastName}`,
          email: prospect.deliveryEndpoint,
          phone: prospect.phone,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendUnlimitedCertificatesLink = (prospect: Prospect, user: User) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-5f563148cc1c4ababb6c3a31ece54fbf',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          firstName: prospect.firstName,
          url: prospect.certificate.unlimitedCertificates.url,
          redemptionUrl: prospect.certificate.redemptionUrl,
          trip: prospect.certificate.title,

          memberName: `${user.firstName} ${user.lastName}`,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendOdenzaCertificateReceipt = (prospect: Prospect, user: User, receiptInfo: any, redemptionCode: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const gravatarUrl = gravatar.url(user.email, { s: '80', d: 'mp' }, false);
  let msg: any;
  msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: prospect.certificate.sgTemplateId2 ? prospect.certificate.sgTemplateId2 : 'd-5f563148cc1c4ababb6c3a31ece54fbf',
    personalizations: [
      {
        to: prospect.deliveryEndpoint,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          {
            email: 'niki@tripvalet.com',
            name: 'Niki Ezzell',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield',
          // },
        ],
        dynamic_template_data: {
          ...user,
          ...receiptInfo,
          firstName: prospect.firstName,
          url: process.env.SFX_REDEEMURL,
          redemptionUrl: prospect.certificate.redemptionUrl,
          trip: prospect.certificate.title,
          certificateId: redemptionCode,

          memberName: `${user.firstName} ${user.lastName}`,
          year: new Date().getFullYear().toString(),
          certImageUrl: find(prospect.certificate.images, { type: 'Email', displayOrder: 1 }).url,
          expires: moment()
            .add(30, 'days')
            .format('MM/DD/YYYY'),
          gravatarUrl,
        },
      },
    ],
  };

  if (prospect.deliveryEndpoint !== user.email) {
    msg.personalizations[0].cc = user.email;
  }

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

export const sendBitcoinTransactionAlert = (user: User, membershipLevel: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const msg = {
    from: {
      email: 'support@tripvaletincentives.com',
      name: 'TripValet Incentives',
    },
    templateId: 'd-9da8463b9557431eb0574a4590299f53',
    personalizations: [
      {
        to: user.email,
        bcc: [
          {
            email: 'troy.zarger@tripvalet.com',
            name: 'Troy Zarger',
          },
          // {
          //   email: 'jimmy@tripvalet.com',
          //   name: 'Jimmy Ezzell',
          // },
          // {
          //   email: 'lorrell@tripvalet.com',
          //   name: 'Lorrell Winfield'
          // }
        ],
        dynamic_template_data: {
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          membership: membershipLevel,
          transactionId: user.crypto.transactionId,
        },
      },
    ],
  };

  sgMail.send(msg);
  return { success: true };
};

export const sendCertificate = async (prospect: Prospect) => {
  const apiKey = prospect.certificate.apiAccessToken; // 'ac87cfc08e28474f1605458a07abd920';
  const apiEmail = encodeURIComponent(prospect.deliveryEndpoint);
  const apiURL = `https://www.creativemarketingincentives.biz/certapi?apikey=${apiKey}&email=${apiEmail}`;
  try {
    const response = await axios.get(apiURL);
    if (response.data === 'SUCCESS') {
      return { sent: true };
    } else {
      return { sent: false, message: 'Failed to send Certificate', data: { response: response.data, apiURL, apiKey } };
    }
  } catch (ex) {
    return { sent: false, message: ex.message, data: { exception: ex, apiURL, apiKey } };
  }
};

export const sendExceptionViaEmail = async (exception: Exception) => {
  try {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
    const msg: MailData = {
      to: 'troy.zarger@tripvalet.com',
      from: {
        email: 'troy.zarger@tripvalet.com',
        name: '[EXCEPTION] TripValet Incentives',
      },
      subject: `[EXCEPTION] on TripValet Incentives`,
      // text: 'Hello plain world!',
      // html: certificate.defaultMessage,
      templateId: 'c6a982f1-96bd-4d8f-b372-b587c28e1ebf',
      substitutions: {
        errorMessage: exception.errorMessage,
        data: formatException(exception),
        location: htmlEncode(exception.location).replace(new RegExp('\n', 'g'), '<br/>'),
      },
    };
    sgMail.send(msg);
    return { success: true };
  } catch (ex) {
    return null;
  }
};

export const sendPasswordReset = async (user: User, token: string) => {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  sgMail.setSubstitutionWrappers('{{', '}}'); // Configure the substitution tag wrappers globally
  const msg: MailData = {
    to: user.email,
    bcc: ['troy.zarger@tripvalet.com'], // , 'jimmy@tripvalet.com', 'lorrell@tripvalet.com'],
    from: {
      email: 'no-reply@yeptribe.com',
      name: 'YEP Tribe',
    },
    subject: `${user.firstName}, Password Reset from YEP Tribe`,
    // text: 'Hello plain world!',
    // html: certificate.defaultMessage,
    // templateId: 'f249feb2-d29f-4247-89dd-db8a27c0d70e',
    templateId: '600ec2dd-b84f-487f-ab1f-7f4c56925fae',
    substitutions: {
      firstName: user.firstName,
      resetUrl: `https://login.yeptribe.com/reset-password/${token}`,
    },
  };
  sgMail.send(msg);
  return { success: true };
};

export const sendProPaySignupEmail = (firstName: string, accNum: string, email: string, password: string) => {
  const templateId = 'd-8f63ef92d38d4c11ac389a67646ac152';

  const gravatarUrl = gravatar.url(email, { s: '80', d: 'mp' }, false);

  sgMail.setApiKey(process.env.SENDGRID_API_KEY);

  const templateData = {
    firstName,
    year: new Date().getFullYear().toString(),
    destinations: email,
    email,
    password,
    accNum,
    expires: moment()
      .add(30, 'days')
      .format('MM/DD/YYYY'),
    gravatarUrl,
  };

  let msg: any;
  msg = {
    from: {
      email: 'no-reply@yeptribe.com',
      name: 'YEP Tribe',
    },
    templateId,
    personalizations: [
      {
        // replyTo: email,
        to: email,
        bcc: ['troy.zarger@tripvalet.com'],

        dynamic_template_data: {
          subject: `${firstName}, Welcome to ProPay`,
          ...templateData,
        },
      },
    ],
  };

  if (process.env.NODE_ENV === 'development') {
    msg.personalizations[0].cc = null;
    msg.personalizations[0].bcc = null;
  }

  sgMail.send(msg);
  return { success: true };
};

// htmlEncode(JSON.stringify(data, null, 2))
//       .replace(new RegExp('\n', 'g'), '<br/>')
//       .replace(new RegExp('\\"', 'g'), '"')
// 			.replace(new RegExp(' ', 'g'), '&nbsp;')

export const createAndSendException = async (
  anyId?: string,
  location?: string,
  message: string = '',
  data: any = { data: null },
  sendExceptionEmail: boolean = true
): Promise<Exception> => {
  const exception = new Exception(null, anyId, location, message, data);
  if (sendExceptionEmail) await sendExceptionViaEmail(exception);
  return exception;
};

export const sendException = async (exception: Exception, sendExceptionEmail: boolean = true): Promise<Exception> => {
  if (sendExceptionEmail) await sendExceptionViaEmail(exception);
  return exception;
};

export const getIp = (req: CustomRequest): string => {
  return req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'][0];
};

export const convertToUrlSlug = (str: string): string => {
  try {
    return str.replace(/\(.+?\)/g, '').replace(/[^a-z0-9+]+/gi, '-');
  } catch (ex) {
    return str;
  }
};

export const capitalizeEachFirstLetter = (str: string): string => {
  try {
    return str
      .trim()
      .split(' ')
      .map(word => {
        return word.charAt(0).toUpperCase() + word.substring(1);
      })
      .join(' ');
  } catch (ex) {
    return str;
  }
};

export const formatSearchTerm = (searchTerm: string[]): string => {
  let aux = '';
  searchTerm.forEach(term => {
    aux += `*${term}*`;
  });
  return aux;
};

export const formatLuceneQueryForDate = (filterValues: DateFilter): string => {
  let query: string;

  if (filterValues) {
    const { filter, value } = filterValues;
    const filterValue = filter.toLocaleLowerCase();
    if (filterValue === 'equals') {
      query = `${moment(value).format('YYYY-MM-DD')}*`;
    }
    if (filterValue === 'before') {
      query = `[* TO ${moment(value).format('YYYY-MM-DD')}]`;
    }
    if (filterValue === 'after') {
      query = `[${moment(value).format('YYYY-MM-DD')} TO NULL]`;
    }
    return query;
  } else {
    return '';
  }
};

const formatException = (exception: Exception) => {
  const result = JSON.stringify(exception.data, null, 4)
    .replace(new RegExp('\n', 'g'), '<br/>')
    .replace(new RegExp('\\"', 'g'), '"')
    .replace(new RegExp(' ', 'g'), '&nbsp;');

  if (result.length > 10000) {
    return 'Data Length Exceeds 10,000 Characters';
  } else {
    return result;
  }
};

export const getAppSettings = async <T extends object>(session: IDocumentSession, whichAppSetting: string): Promise<T> => {
  return <T>(<unknown>session.load<T>(`AppSettings/${whichAppSetting}`));
};

export interface Context {
  store: IDocumentStore;
  session: IDocumentSession;
  req: CustomRequest;
  res: express.Response;
  users?: User;
}

export interface ICookieSession {
  id?: string;
  email?: string;
  roles?: string[];
  token: string;
}

export interface IDateFilter {
  value: Date;
  filter: String;
}

export interface CustomRequest extends express.Request {
  // session: {
  //   user: ICookieSession;
  //   nowInMinutes: number;
  // };
  db: IDocumentStore;
  user?: JwtUser;
}

export const getShortUuid = (): string => {
  const cookieTranslator = short(short.constants.flickrBase58);
  return cookieTranslator.generate();
};

export const stripHtmlTags = (html: string): string => {
  html = html.replace('</p><p>', ' ');
  return striptags(html);
};
