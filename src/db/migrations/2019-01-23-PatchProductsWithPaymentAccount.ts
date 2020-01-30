import { IDocumentStore, PatchByQueryOperation } from 'ravendb';
import { PaymentAccountEnum } from '@/types/Enums';

export default {
  name: '2019-01-23-PatchProductsWithPaymentAccount',
  up: async (store: IDocumentStore) => {
    const patch = new PatchByQueryOperation(`from Products as p
    update {
        p.paymentAccount = '${PaymentAccountEnum.TripValetLLC}'
    }`);
    const operation = await store.operations.send(patch);
    await operation.waitForCompletion();
  },
  down: async () => {
    console.log('2019-01-23-PatchProductsWithPaymentAccount > down');
  },
};
