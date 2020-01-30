import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';
import { Event } from '@/types/event';

export default {
  name: '2019-09-18-EventsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Events());
  },
  down: async () => {
    console.log('2019-09-18-EventsIndex > down');
  },
};
