import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-08-06-Prospects',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Prospects());
  },
  down: async (store: IDocumentStore) => {
    console.log('2019-08-06-Prospects > down');
  }
};
