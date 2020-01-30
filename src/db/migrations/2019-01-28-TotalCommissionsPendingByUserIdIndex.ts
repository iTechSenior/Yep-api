import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-01-28-TotalCommissionsPendingByUserIdIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.TotalCommissionsPendingByUserId());
  },
  down: async () => {
    console.log('2019-01-28-TotalCommissionsPendingByUserIdIndex > down');
  },
};
