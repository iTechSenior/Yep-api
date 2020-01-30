import { IDocumentStore } from 'ravendb';
import { Certificate } from '@/types/certificate';
const baseCertImageUrl = 'https://s3.us-east-2.amazonaws.com/com.tripvalet.incentives/certificates/marketing-tools/all-certificates/images/';
const baseCertPdfUrl = 'https://s3.us-east-2.amazonaws.com/com.tripvalet.incentives/certificates/marketing-tools/all-certificates/pdfs/';

const baseRedemptionImageUrl = 'https://s3.us-east-2.amazonaws.com/com.tripvalet.incentives/certificates/marketing-tools/redemption/images/';

const certificates = ['5D4N-MEXICO', '8D7N-MEXICO', 'LAS-VEGAS', '2N-Getaway-For-2', '2N-Sunscape-All-Inclusive', '8D7N-3500'];
const certTitles = [
  '4 Night - Resort Collection',
  '7 Night - Resort Collection',
  '3 Nights - Las Vegas Getaway',
  '2 Night Hotel Getaway for 2',
  '2 Night Sunscape All Inclusive',
  '8 Day / 7 Night Resort/Condo - 3500 + Locations',
];

const getRedemptionImgUrl = (certificateTitle: string) => {
  const index = certTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '/#';
  }
  const redemptionImgUrl = baseRedemptionImageUrl + certificates[index] + '.jpg';
  return redemptionImgUrl;
};

const getCertImgUrl = (certificateTitle: string) => {
  const index = certTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '/#';
  }
  const certImgUrl = baseCertImageUrl + certificates[index] + '.jpg';
  return certImgUrl;
};

const getCertPdfUrl = (certificateTitle: string) => {
  const index = certTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '/#';
  }
  const certPdfUrl = baseCertPdfUrl + certificates[index] + '.pdf';
  return certPdfUrl;
};

export default {
  name: '2019-08-09-AddRedemptionCertificatetoDoc',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const certificates = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .all();

    for (const certificate of certificates) {
      certificate.documents = [certificate.documents[0]];
      certificate.documents.push({
        active: true,
        displayOrder: 1,
        id: certificate.documents[0].id,
        images: [
          {
            displayOrder: 1,
            type: 'Thumbnail',
            url: getRedemptionImgUrl(certificate.title),
          },
        ],
        type: 'Redemption',
        url: certificate.redemptionUrl,
      });

      certificate.documents.push({
        active: true,
        displayOrder: 1,
        id: certificate.documents[0].id,
        images: [
          {
            displayOrder: 1,
            type: 'Thumbnail',
            url: getCertImgUrl(certificate.title),
          },
        ],
        type: 'Certificate',
        url: getCertPdfUrl(certificate.title),
      });
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-08-09-AddRedemptionCertificatetoDoc > down');
  },
};
