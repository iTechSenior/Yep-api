import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-08-08-CommissionsIndex',
  up: async (store: IDocumentStore) => {
    // await new indexes.Commissions().execute(store);
    await store.executeIndex(new indexes.Commissions());
  },
  down: async () => {
    console.log('2019-08-08-CommissionsIndex > down');
  },
};
