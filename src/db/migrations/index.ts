import Orders from './2018-10-28-OrdersIndex';
import OrderCommissionToRootCommissionDocuments from './2018-10-28-OrderCommissionToRootCommissionDocuments';
import CommissionsPendingByAffiliate from './2018-11-01-CommissionsPendingByAffiliateIndex';
import CommissionsByAffiliateLifetime from './2018-11-01-CommissionsByAffiliateLifetimeIndex';
import Commissions from './2019-08-08-CommissionsIndex';
import AddOrderTotalToCommission from './2018-11-01-AddOrderTotalToCommission';
import RedoUserSubscription from './2018-11-11-RedoUserSubscription';
import UserSubscriptions from './2018-11-20-UserSubscriptionsIndex';
import Leads from './2019-11-24-LeadsIndex';
import PatchProductsWithSetup from './2018-11-26-PatchProductsWithSetup';
import PatchFunnelsWithSetup from './2018-11-26-PatchFunnelsWithSetup';
import LeadVisitsIndexes from './2018-12-01-LeadVisitsIndexes';
import AddDisplayNameToProduct from './2018-12-01-AddDisplayNameToProduct';
import AddProductDisplayNameToFunnelSteps from './2018-12-01-AddProductDisplayNameToFunnelSteps';
import UpdateProspectsWithDeliveryEndpointAndMethod from './2018-12-02-UpdateProspectsWithDeliveryEndpointAndMethod';
import Users from './2019-10-08-UserIndex';
import Funnels from './2018-12-05-FunnelsIndex';
import Prospects from './2019-08-06-Prospects';
import CertificatesMembershipLevelToArray from './2018-12-19-CertificatesMembershipLevelToArray';
import PatchProductsWithPaymentAccount from './2019-01-23-PatchProductsWithPaymentAccount';
import TotalEscapeBucksByUserIdIndex from './2019-01-28-TotalEscapeBucksByUserIdIndex';
import TotalCommissionsPaidByUserIdIndex from './2019-01-28-TotalCommissionsPaidByUserIdIndex';
import TotalCommissionsPendingByUserIdIndex from './2019-01-28-TotalCommissionsPendingByUserIdIndex';
import ContactsIndex from './2019-06-03-ContactsIndex';
import ContactEmailsIndex from './2019-07-29-ContactEmailsIndex';
import AddRedemptionUrlToCertificate from './2019-07-02-AddRedemptionUrlToCertificate';
import AddRedemptionUrlToHealthcare from './2019-07-06-AddRedemptionUrlForHealthcare';
import AddSGTemplateIdToCertificate from './2019-07-13-AddSGTemplateIdsToCertificates';
import AddRedemptionCertificatetoDoc from './2019-08-09-AddRedemptionCertificatetoDoc';
import EventsIndex from './2019-09-18-EventsIndex';
import AddEventCollection from './2019-08-30-AddEventCollection';
import AddLatAndLngToUser from './2019-09-20-AddLatAndLngToUser';
import AddLatAndLngToEvents from './2019-09-20-AddLatAndLngToEvents';
import AddTypeToEvents from './2019-09-20-AddTypeToEvents';
import AddTimeZoneToEvents from './2019-09-20-AddTimeZoneToEvents';
import VideosIndex from './2019-11-25-VideosIndex';
import PlaylistsIndex from './2019-11-21-PlaylistsIndex';
import YepCutoffsIndex from './2019-11-26-YepCutoffsIndex';
import ShareableContentsIndex from './2019-12-12-ShareableContentsIndex';

export default {
  [Orders.name]: Orders,
  [Users.name]: Users,
  [OrderCommissionToRootCommissionDocuments.name]: OrderCommissionToRootCommissionDocuments,
  [CommissionsPendingByAffiliate.name]: CommissionsPendingByAffiliate,
  [CommissionsByAffiliateLifetime.name]: CommissionsByAffiliateLifetime,
  [Commissions.name]: Commissions,
  [AddOrderTotalToCommission.name]: AddOrderTotalToCommission,
  [RedoUserSubscription.name]: RedoUserSubscription,
  [UserSubscriptions.name]: UserSubscriptions,
  [Funnels.name]: Funnels,
  [Leads.name]: Leads,
  [PatchProductsWithSetup.name]: PatchProductsWithSetup,
  [PatchFunnelsWithSetup.name]: PatchFunnelsWithSetup,
  [LeadVisitsIndexes.name]: LeadVisitsIndexes,
  [AddDisplayNameToProduct.name]: AddDisplayNameToProduct,
  [AddProductDisplayNameToFunnelSteps.name]: AddProductDisplayNameToFunnelSteps,
  [UpdateProspectsWithDeliveryEndpointAndMethod.name]: UpdateProspectsWithDeliveryEndpointAndMethod,
  [Prospects.name]: Prospects,
  [CertificatesMembershipLevelToArray.name]: CertificatesMembershipLevelToArray,
  [PatchProductsWithPaymentAccount.name]: PatchProductsWithPaymentAccount,
  [TotalEscapeBucksByUserIdIndex.name]: TotalEscapeBucksByUserIdIndex,
  [TotalCommissionsPaidByUserIdIndex.name]: TotalCommissionsPaidByUserIdIndex,
  [TotalCommissionsPendingByUserIdIndex.name]: TotalCommissionsPendingByUserIdIndex,
  [ContactsIndex.name]: ContactsIndex,
  [ContactEmailsIndex.name]: ContactEmailsIndex,
  [AddRedemptionUrlToCertificate.name]: AddRedemptionUrlToCertificate,
  [AddRedemptionUrlToHealthcare.name]: AddRedemptionUrlToHealthcare,
  [AddSGTemplateIdToCertificate.name]: AddSGTemplateIdToCertificate,
  [AddRedemptionCertificatetoDoc.name]: AddRedemptionCertificatetoDoc,
  [AddEventCollection.name]: AddEventCollection,
  [EventsIndex.name]: EventsIndex,
  [AddLatAndLngToUser.name]: AddLatAndLngToUser,
  [AddLatAndLngToEvents.name]: AddLatAndLngToEvents,
  [AddTypeToEvents.name]: AddTypeToEvents,
  [AddTimeZoneToEvents.name]: AddTimeZoneToEvents,
  [VideosIndex.name]: VideosIndex,
  [PlaylistsIndex.name]: PlaylistsIndex,
  [YepCutoffsIndex.name]: YepCutoffsIndex,
  [ShareableContentsIndex.name]: ShareableContentsIndex,
};
