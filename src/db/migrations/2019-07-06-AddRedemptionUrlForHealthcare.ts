import { IDocumentStore } from 'ravendb';
import { Certificate } from '@/types/certificate';

const baseRedemptionPdfUrl = 'https://s3.us-east-2.amazonaws.com/com.tripvalet.incentives/certificates/marketing-tools/redemption/pdfs/';

export default {
  name: '2019-07-06-AddRedemptionUrlForHealthcare',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const certificates = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .all();

    for (const certificate of certificates) {
      if (certificate.title === 'Free Healthcare Discount Card') {
        certificate.redemptionUrl = baseRedemptionPdfUrl + 'Healthcare-Card-Redemption.pdf';
      }
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-07-06-AddRedemptionUrlForHealthcare > down');
  },
};
