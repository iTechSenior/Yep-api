import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-12-01-AddDisplayNameToProduct',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Products as p
    update {
        p.displayName = p.name
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2018-12-01-AddDisplayNameToProduct > down');
  },
};
