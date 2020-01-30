import { IDocumentStore } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-12-01-LeadVisitsIndexes',
  up: async (store: IDocumentStore) => {
    await store.executeIndex(new indexes.LeadVisitsByDay());
    await store.executeIndex(new indexes.LeadVisitsByMonth());
    await store.executeIndex(new indexes.LeadVisitsByYear());
  },
  down: async () => {
    console.log('2018-12-01-LeadVisitsIndexes > down');
  },
};
