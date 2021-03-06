import { AbstractIndexCreationTask } from 'ravendb';

class LeadVisitsByMonth extends AbstractIndexCreationTask {
  public constructor() {
    super();

    this.map = `from leadVisits in docs.LeadVisits
    select new {
        affiliateUserId = leadVisits.affiliateUserId,
        date = new DateTime(leadVisits.createdAt.Date.Year, leadVisits.createdAt.Date.Month, 1),
        ip = leadVisits.ip,
        count = 1
        
    }`;

    this.reduce = `from result in results
    group result by new { result.affiliateUserId, result.date, result.ip } into g
    select new {
        affiliateUserId = g.Key.affiliateUserId,
        date = g.Key.date,
        ip = g.Key.ip,
        count = g.Sum(x=>x.count)
    }`;

    this.outputReduceToCollection = 'LeadVisitsByMonth';
  }
}

export { LeadVisitsByMonth };
