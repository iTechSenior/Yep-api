import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import * as indexes from './indexes';
import { from } from 'apollo-link';

export default {
  name: '2018-11-26-PatchFunnelsWithSetup',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Funnels as f
    update {
        f.funnelSteps.map(funnelStep => {
            funnelStep.products.map(product => {
                product.setup = {
                    fee: 0,
                    description: ''
                }
            })  
        })
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2018-11-26-PatchFunnelsWithSetup > down');
  },
};
