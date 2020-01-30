import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-11-26-YepCutoffsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.YepCutoffs());
  },
  down: async () => {
    console.log('2019-11-26-YepCutoffsIndex > down');
  },
};
