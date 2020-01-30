import { IDocumentStore, PutIndexesOperation, IndexDefinition } from 'ravendb';
import * as indexes from './indexes';
import moment = require('moment');
import { DateTime } from 'luxon';
import { Order, OrderReference } from '@/types/order';
import { Commission } from '@/types/commission';

export default {
  name: '2019-10-28-OrderCommissionToRootCommissionDocuments',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const orders = await session.query<Order>({ collection: 'Orders' }).all();

    const commissions: Commission[] = [];
    for (const order of orders) {
      for (const c of order.commissions) {
        const commission = new Commission(
          c.payCommissionOn,
          c.commissionAmount,
          c.status,
          order.customer,
          c.affiliate,
          order.invoice,
          new OrderReference(order.id, order.products, order.totalAmount),
          c.tier,
          c.revenueShare
        );
        commission.createdAt = moment(order.payment.created).toDate();
        commission.updatedAt = moment().toDate();
        commissions.push(commission);
      }
    }

    const tryBulkUpdate = store.bulkInsert();
    for (const commission of commissions) {
      await tryBulkUpdate.store(commission, commission.id);
    }
    await tryBulkUpdate.finish();
  },
  down: async (store: IDocumentStore) => {
    console.log('0001-OrdersIndex > down');
  },
};
