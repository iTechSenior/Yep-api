import { IDocumentStore } from 'ravendb';
import { Certificate } from '@/types/certificate';

const baseRedemptionPdfUrl = 'https://s3.us-east-2.amazonaws.com/com.tripvalet.incentives/certificates/marketing-tools/redemption/pdfs/';
const redemptionTitles = [
  '3-5-DAY-GETAWAY',
  '3D2N-CRUISE-BAHAMAS',
  '5D4N-MEXICO',
  '8D7N-3500',
  '8D7N-MEXICO',
  'AIRFARE-&-HOTEL-Redemption',
  'GOLF-N-STAY-CABO',
  'LAS-VEGAS',
];
const certificateTitles = [
  '3 Day / 2 Night Hotel Stay',
  '3 Day / 2 Night Bahamas Cruise',
  '4 Night - Resort Collection',
  '8 Day / 7 Night Resort/Condo - 3500 + Locations',
  '7 Night - Resort Collection',
  'Airfare & Hotel For Two',
  "Golf N' Stay In Cabo San Lucas",
  '3 Nights - Las Vegas Getaway',
];

const getRedemptionUrl = (certificateTitle: string) => {
  const index = certificateTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '/#';
  }
  const redemptionUrl = baseRedemptionPdfUrl + redemptionTitles[index] + '.pdf';
  return redemptionUrl;
};

export default {
  name: '2019-07-02-AddRedemptionUrlToCertificate',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const certificates = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .all();

    for (const certificate of certificates) {
      certificate.redemptionUrl = getRedemptionUrl(certificate.title);
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-07-02-AddRedemptionUrlToCertificate > down');
  },
};
