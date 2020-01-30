import { IDocumentStore, PatchByQueryOperation } from 'ravendb';

export default {
  name: '2018-12-19-CertificatesMembershipLevelToArray',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Certificates as c
    update {
        let level = c.membershipLevel
        c.membershipLevel = [level]
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2018-12-19-CertificatesMembershipLevelToArray > down');
  },
};
