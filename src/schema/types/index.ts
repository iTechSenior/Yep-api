import * as appSettings from './appSettings';
import * as user from './user';
import * as domain from './domain';
import * as sor from './sor';
import * as sponsor from './sponsor';
import * as stripe from './stripe';
import * as userCrypto from './userCrypto';
import * as userSubscription from './userSubscription';
import * as video from './video';
import * as revenueShare from './revenueShare';
import * as prospect from './prospect';
import * as product from './product';
import * as propay from './propay';
import * as phone from './phone';
import * as order from './order';
import * as lead from './lead';
import * as healthCheck from './healthCheck';
import * as funnel from './funnel';
import * as exception from './exception';
import * as escapeBuck from './escapeBuck';
import * as dumpBucket from './dumpBucket';
import * as document from './document';
import * as contactEmail from './contactEmail';
import * as contact from './contact';
import * as common from './common';
import * as coinmd from './coinmd';
import * as clickFunnelsWebHook from './clickFunnelsWebHook';
import * as clickFunnels from './clickFunnels';
import * as clickFunnelPurchase from './clickFunnelPurchase';
import * as certificateRedemptionCode from './certificateRedemptionCode';
import * as certificate from './certificate';
import * as ancestry from './ancestry';
import * as ambassador from './ambassador';
import * as affiliateLink from './affiliateLink';
import * as address from './address';
import * as trips from './trips';
import * as event from './event';
import * as yepCommission from './yepCommission';
import * as shareableContent from './shareableContent';
import { JwtUser } from './JwtUser';
import * as Enums from './Enums';
import { TablePaginationArgs } from './TablePaginationArgs';
import { TablePaginationWithSearchTextArgs } from './TablePaginationWithSearchTextArgs';

export default {
  ...appSettings,
  ...user,
  ...domain,

  ...sor,
  ...sponsor,
  ...stripe,
  ...userCrypto,
  ...userSubscription,
  ...video,

  ...revenueShare,
  ...prospect,
  ...propay,
  ...product,
  ...phone,
  ...order,
  ...lead,

  ...healthCheck,
  ...funnel,
  ...exception,
  ...escapeBuck,
  ...dumpBucket,
  ...document,

  ...contactEmail,
  ...contact,
  ...common,
  ...coinmd,
  ...clickFunnelsWebHook,
  ...clickFunnels,
  ...clickFunnelPurchase,
  ...certificateRedemptionCode,
  ...certificate,
  ...ancestry,
  ...ambassador,
  ...affiliateLink,
  ...address,
  ...trips,
  ...event,
  ...yepCommission,
  ...shareableContent,
  ...Enums,
  JwtUser,
  TablePaginationArgs,
  TablePaginationWithSearchTextArgs,
};
