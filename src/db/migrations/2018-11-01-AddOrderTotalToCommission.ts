import { IDocumentStore, AwaitableMaintenanceOperation } from 'ravendb';
import { Commission } from '@/types/commission';

export default {
  name: '2019-11-01-AddOrderTotalToCommission',
  up: async (store: IDocumentStore) => {
    store.conventions.maxNumberOfRequestsPerSession = 100;
    const session = store.openSession();
    const commissions = await session.query<Commission>({ collection: 'commissions' }).all();
    commissions.forEach(commission => {
      commission.order.orderTotal = commission.order.products.map(p => p.amount).reduce((prev, current) => prev + current);
    });
    await session.saveChanges();
    // const tryBulkUpdate = store.bulkInsert();
    // for (const commission of commissions) {
    //   await tryBulkUpdate.store(commission, commission.id);
    // }
    // await tryBulkUpdate.finish();
  },
  down: async () => {
    console.log('2019-11-01-AddOrderTotalToCommission > down');
  },
};
