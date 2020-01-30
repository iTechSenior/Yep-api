import { AbstractIndexCreationTask } from 'ravendb';

class Orders extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from orders in docs.Orders
    from products in orders.products
    select new
    {
        Query = new
        {
            customerEmail = orders.customer.email,
            customerFirstName = orders.customer.firstName,
            customerLastName = orders.customer.lastName,
            productName = products.name
        },
        domainId = orders.domain.id,
        domainTld = orders.domain.tld,
        productId = products.id,
        stripeInvoiceId = orders.invoice.invoiceId,
        stripeCustomerId = orders.invoice.customerId
    }`;
  }
}

export { Orders };
