import { IDocumentStore } from 'ravendb';
import zipcodes from 'zipcodes';
import { Event } from '@/types/event';

export default {
  name: '2019-09-20-AddLatAndLngToEvents',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const events = await session.query<Event>({ collection: 'Events' }).all();

    for (const event of events) {
      const location = zipcodes.lookup(event.address.zip);

      if (location) {
        event.coordinate = { lat: location.latitude, lng: location.longitude };
      }
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-09-20-AddLatAndLngToEvents > down');
  },
};
