import { IDocumentStore } from 'ravendb';
import { find } from 'lodash';
import { Product } from '@/types/product';
import { Funnel } from '@/types/funnel';

export default {
  name: '018-12-01-AddProductDisplayNameToFunnelSteps',
  up: async (store: IDocumentStore) => {
    const session = store.openSession();
    const products = await session.query<Product>({ collection: 'Products' }).all();
    const funnels = await session.query<Funnel>({ collection: 'Funnels' }).all();

    for (const funnel of funnels) {
      for (const funnelStep of funnel.funnelSteps) {
        for (const funnelStepProduct of funnelStep.products) {
          const product = find(products, (product: Product) => {
            return funnelStepProduct.id === product.id;
          });
          funnelStepProduct.displayName = product.displayName;
        }
      }
    }
    await session.saveChanges();
  },
  down: async () => {
    console.log('018-12-01-AddProductDisplayNameToFunnelSteps > down');
  },
};
