import { AbstractIndexCreationTask } from 'ravendb';

class Commissions extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from commission in docs.Commissions
    let customer = LoadDocument(commission.customer.id, "Users")
    select new
    {
        Query = new
        {
            commission.payCommissionOn,
            commission.status,
            _cEmail = commission.customer.email,
            _aEmail = commission.affiliate.email,
            _cName = commission.customer.firstName + ' ' + commission.customer.lastName,
            _aName = commission.affiliate.firstName + ' ' + commission.affiliate.lastName,
            createdAt = commission.createdAt,
            products = commission.order.products,
            orderId = commission.order.id,
            affiliatePayoutMethod = customer.payoutMethod
        },
        customerId = commission.customer.id,
        affiliateId = commission.affiliate.id,
        orderId = commission.order.id,
        products = commission.order.products,
        payCommissionOn = commission.payCommissionOn,
        createdAt = commission.createdAt,
        affiliatePayoutMethod = customer.payoutMethod,
    }`;

    this.store('orderId', 'Yes');
    this.store('products', 'Yes');
    this.store('affiliatePayoutMethod', 'Yes');
  }
}

export { Commissions };
