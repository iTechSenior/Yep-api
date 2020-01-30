import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-10-28-OrdersIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Orders());
  },
  down: async (store: IDocumentStore) => {
    console.log('2018-10-28-OrdersIndex > down');
  },
};
