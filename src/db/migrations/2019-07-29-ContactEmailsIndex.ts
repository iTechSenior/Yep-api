import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-07-29-ContactEmailsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.ContactEmails());
  },
  down: async () => {
    console.log('2019-07-29-ContactEmailsIndex > down');
  }
};
