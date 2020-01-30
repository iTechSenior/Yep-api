import { AbstractIndexCreationTask } from 'ravendb';

class UserSubscriptions extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from us in docs.UserSubscriptions
    select new {
        Query = new {
            userEmail = us.user.email,
            affiliateEmail = us.affiliate.email,
            us.status
        },
        userId = us.user.id,
        affiliateId = us.affiliate.id,
        status = us.status,
        start = us.start,
        currentPeriodStart = us.currentPeriodStart,
        currentPeriodEnd = us.currentPeriodEnd
    }`;
  }
}

export { UserSubscriptions };
