import { buildSchema } from 'type-graphql';
import { UserResolver } from './users';
import { CertificateResolver } from './certificates';
import { AppSettingsResolver } from './appSettings';
import { CommissionResolver } from './commissions';
import { ContactResolver } from './contacts';
import { ContactEmailsResolver } from './contactEmails';
import { ProspectResolver } from './prospect';
import { DocumentResolver } from './document';
import { FunnelResolver } from './funnels';
import { ProPayResolver } from './propay';
import { CommonResolver } from './common';
import { VideoResolver } from './videos';
import { TripResolver } from './trip';
import { EventResolver } from './event';
import { AdminResolver } from './admin';
import { ContentResolver } from './content';

export const createSchema = () =>
  buildSchema({
    resolvers: [
      DocumentResolver,
      UserResolver,
      CertificateResolver,
      AppSettingsResolver,
      CommissionResolver,
      ContactResolver,
      ContactEmailsResolver,
      ProspectResolver,
      FunnelResolver,
      ProPayResolver,
      CommonResolver,
      VideoResolver,
      EventResolver,
      AdminResolver,
      ContentResolver,
      // TripResolver,
    ],
    // authChecker: ({ context: { req } }) => {
    //   return !!req.session.userId;
    // },
    validate: false,
  });
