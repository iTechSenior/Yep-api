import { AbstractIndexCreationTask } from 'ravendb';

class CommissionsByAffiliateLifetime extends AbstractIndexCreationTask {
  public constructor() {
    super();

    this.map = `from c in docs.Commissions
    where c.status != "Pending"
    select new {
        c.affiliate.firstName,
        c.affiliate.lastName,
        c.affiliate.email,
        c.affiliate.id,
        c.order.orderTotal,
        c.commissionAmount,
        count = 1
    }`;

    this.reduce = `from result in results
    group result by new { result.firstName, result.lastName, result.email, result.id } into g
    select new
    {
      firstName = g.Key.firstName,
      lastName = g.Key.lastName,
      email = g.Key.email,
      id = g.Key.id,
      orderTotal = g.Sum(x => x.orderTotal),
      commissionAmount = g.Sum(x => x.commissionAmount),
      count = g.Sum(x => x.count)
    }`;
  }
}

export { CommissionsByAffiliateLifetime };
