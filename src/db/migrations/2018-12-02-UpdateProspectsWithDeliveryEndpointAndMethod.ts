import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import * as indexes from './indexes';

export default {
  name: '2018-12-02-UpdateProspectsWithDeliveryEndpointAndMethod',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Prospects as p
    update {
        p.deliveryMethod = "Email",
        p.deliveryEndpoint = p.email
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2018-12-02-UpdateProspectsWithDeliveryEndpointAndMethod > down');
  },
};
