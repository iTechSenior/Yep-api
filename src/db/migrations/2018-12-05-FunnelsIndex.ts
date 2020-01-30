import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-12-05-FunnelsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Funnels());
  },
  down: async () => {
    console.log('2018-12-05-FunnelsIndex > down');
  },
};
