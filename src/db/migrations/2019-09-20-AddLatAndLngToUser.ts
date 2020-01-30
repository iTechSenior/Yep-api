import { IDocumentStore } from 'ravendb';
import { User } from '@/types/user';
import { Roles } from '@/helpers/utils';
import zipcodes from 'zipcodes';

export default {
  name: '2019-09-20-AddLatAndLngToUser',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const users = await session
      .query<User>({ collection: 'Users' })
      .whereIn('roles', [Roles.YEPLocal])
      .all();

    for (const user of users) {
      const location = zipcodes.lookup(user.address.zip);

      if (location) {
        user.coordinate = { lat: location.latitude, lng: location.longitude };
      }
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('2019-09-20-AddLatAndLngToUser > down');
  },
};
