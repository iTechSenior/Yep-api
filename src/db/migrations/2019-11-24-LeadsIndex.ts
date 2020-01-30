import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-11-24-LeadsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Leads());
  },
  down: async () => {
    console.log('2019-11-24-LeadsIndex > down');
  }
};
