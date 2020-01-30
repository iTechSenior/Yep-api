import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-06-03-ContactsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Contacts());
  },
  down: async () => {
    console.log('2019-06-03-ContactsIndex > down');
  },
};
