import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-11-25-VideosIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Videos());
  },
  down: async () => {
    console.log('2019-11-25-VideosIndex > down');
  },
};
