import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import * as indexes from './indexes';
import { from } from 'apollo-link';

export default {
  name: '2020-11-26-PatchProductsWithSetup',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Products as p
    update {
        p.setup = {
            fee: 0,
            description: ''
        }
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2020-11-26-PatchProductsWithSetup > down');
  },
};
