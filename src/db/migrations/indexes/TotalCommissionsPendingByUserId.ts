import { AbstractIndexCreationTask } from 'ravendb';

class TotalCommissionsPendingByUserId extends AbstractIndexCreationTask {
  public constructor() {
    super();

    this.map = `from c in docs.Commissions
    where c.status == "Pending"
    select new {
        userId = c.affiliate.id,
        c.commissionAmount,
    }`;

    this.reduce = `from result in results
    group result by new { result.userId } into g
    select new
    {
      userId = g.Key.userId,
      commissionAmount = g.Sum(x => x.commissionAmount),
    }`;
  }
}

export { TotalCommissionsPendingByUserId };
