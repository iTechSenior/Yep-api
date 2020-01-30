import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';
import { Event } from '@/types/event';

export default {
  name: '2019-08-30-AddEventCollection',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const event = new Event('Users/1-A', 'test', new Date(), 'EST', 'Webinar', null, null, 'here', null, [], false);
    await session.store(event);
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-08-30-AddEventCollection > down');
  },
};
