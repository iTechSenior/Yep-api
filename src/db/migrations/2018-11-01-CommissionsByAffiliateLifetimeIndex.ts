import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2021-11-01-CommissionsByAffiliateLifetimeIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.CommissionsByAffiliateLifetime());
  },
  down: async () => {
    console.log('2020-10-31-CommissionsByAffiliateIndex > down');
  },
};
