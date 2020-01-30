import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-11-20-UserSubscriptionsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.UserSubscriptions());
  },
  down: async () => {
    console.log('2018-11-20-UserSubscriptionsIndex > down');
  },
};
