import { IDocumentStore } from 'ravendb';
import { Certificate } from '@/types/certificate';

const sgTemplateId1 = [
  '', // 38-A
  '', // 6-A
  'd-ebfae3e853bd40f6a0a40bbbaf5ee45f', // 35-A
  'd-2164777e77c54251b35e54047c7b7d43', // 4-A
  'd-5b3e011ad1124a638ef6fcc12387eaaa', // 36-A
  'd-8f06b16fb48d42789881b0abd4710a31', // 3-A
  'd-b9c0fc0c7bd749b49555441c9dd48967', // 5-A
  'd-935fce0c6a7e4d21877744f6a4058046', // 37-A
  'd-e0930f92c9a14e028fe06bef1700204b', // 34-A
  'd-c8d4123c049844189694deae9dab9fad', // 39-A
  'd-2de7429671024d5e86b1483d5730b1f5', // 40-A
];
const sgTemplateId2 = [
  '', // 38-A
  '', // 6-A
  'd-796920179cad4906870c1efa83ca998a', // 35-A
  'd-4fb770a21a114f138ee04e1af1a5ef4d', // 4-A
  'd-2fe859f148c443218579809979b26120', // 36-A
  'd-41d3378bc69f41018ae6b7c4ae6b4d0b', // 3-A
  'd-5a8c8c09d6f44abb86fa84f7d7eac53a', // 5-A
  '', // 37-A
  '', // 34-A
  'd-141c362516fc4c8c8e023d524d9e4887', // 39-A
  'd-da1898a302d24da3b8c2915f4dd68bec', // 40-A
];
const certificateTitles = [
  '3 Day / 2 Night Hotel Stay', // 38-A
  '3 Day / 2 Night Bahamas Cruise', // 6-A
  '4 Night - Resort Collection', // 35-A
  '8 Day / 7 Night Resort/Condo - 3500 + Locations', // 4-A
  '7 Night - Resort Collection', // 36-A
  'Airfare & Hotel For Two', // 3-A
  "Golf N' Stay In Cabo San Lucas", // 5-A
  '3 Nights - Las Vegas Getaway', // 37-A
  'Free Healthcare Discount Card', // 34-A
  '2 Night Sunscape All Inclusive', // 39-A
  '2 Night Hotel Getaway for 2', // 40-A
];

const getTemplateId1 = (certificateTitle: string) => {
  const index = certificateTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '';
  }
  const templateId1 = sgTemplateId1[index];
  return templateId1;
};

const getTemplateId2 = (certificateTitle: string) => {
  const index = certificateTitles.indexOf(certificateTitle);
  if (index < 0) {
    return '';
  }
  const templateId2 = sgTemplateId2[index];
  return templateId2;
};

export default {
  name: '2019-07-13-AddSGTemplateIdsToCertificates',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const certificates = await session
      .query<Certificate>({ collection: 'Certificates' })
      .whereEquals('active', true)
      .all();

    for (const certificate of certificates) {
      certificate.sgTemplateId1 = getTemplateId1(certificate.title);
      certificate.sgTemplateId2 = getTemplateId2(certificate.title);
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-07-13-AddSGTemplateIdsToCertificates > down');
  },
};
