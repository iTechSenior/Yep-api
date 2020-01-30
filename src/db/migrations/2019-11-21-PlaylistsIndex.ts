import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2019-11-21-PlaylistsIndex',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.Playlists());
  },
  down: async () => {
    console.log('2019-11-21-PlaylistsIndex > down');
  },
};
