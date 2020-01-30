import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-12-12-ShareableContentsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.ShareableContents());
  },
  down: async () => {
    console.log('2019-12-12-ShareableContentsIndex > down');
  },
};
