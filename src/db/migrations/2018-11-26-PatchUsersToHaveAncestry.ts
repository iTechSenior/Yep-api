import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import * as indexes from './indexes';
import { from } from 'apollo-link';
import { getIdWithoutCollection } from '../../helpers/user';
import { User } from '@/types/user';

export default {
  name: '2018-11-26-PatchUsersToHaveAncestry',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    try {
      // create a query
      const query = session.query({ indexName: 'Users' });

      const users: User[] = [];
      let stats;
      // stream() returns a Readable
      // get query stats passing a stats callback to stream() method
      const queryStream = await session.advanced.stream(query, _ => (stats = _));

      queryStream.on('data', user => {
        // User { name: 'Anna', id: 'users/1-A' }
        if (!user.document.ancestry) {
          console.log(user.document.id);
          users.push(user.document);
        }
      });

      // get stats using an event listener
      queryStream.once('stats', stats => {
        console.log('stats', stats);
        // { resultEtag: 7464021133404493000,
        //   isStale: false,
        //   indexName: 'Auto/users/Byage',
        //   totalResults: 1,
        //   indexTimestamp: 2018-10-01T09:04:07.145Z }
      });

      queryStream.on('error', err => {
        // handle errors
        console.log('error', err);
      });

      queryStream.on('end', async err => {
        // handle errors
        console.log('end');

        for (const user of users) {
          user.ancestry = {
            depth: 1,
          };

          // fixChildren(users, user);

          // const sponsor = find(users, findUser => {
          //   return findUser.coinMD.memberNumber === user.coinMD.sponsorMemberNumber;
          // });
          // if (sponsor) {
          //   if (user.ancestry.depth !== sponsor.ancestry.depth + 1) {
          //     console.log('depth not right', user.id, user.ancestry.depth, sponsor.ancestry.depth, appendUserIdToAncestors(sponsor.id, sponsor.ancestry.ancestors));
          //     user.ancestry.ancestors = appendUserIdToAncestors(sponsor.id, sponsor.ancestry.ancestors);
          //     user.ancestry.depth = sponsor.ancestry.depth + 1;
          //     user.ancestry.parentUserId = sponsor.id;
          //   }
          // } else {
          //   console.log('sponsor not found', user);
          // }
        }

        console.log('for/of done');
        // console.log('Starting to tryBulkUpdate', users.length);
        // const tryBulkUpdate = store.bulkInsert();
        // for (const user of users) {
        //   await tryBulkUpdate.store(user, user.id);
        // }
        // console.log('Wrapping Up tryBulkUpdate', users.length);
        // await tryBulkUpdate.finish();
      });
    } catch (ex) {
      console.log(ex.message);
    }
  },
  down: async () => {
    console.log('2018-11-26-PatchUsersToHaveAncestry > down');
  },
};
