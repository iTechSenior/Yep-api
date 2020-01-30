import { AbstractIndexCreationTask } from 'ravendb';

class YepCutoffs extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from yepcutoffs in docs.YepCutoffs
    select new
    {
        Query = new
        {
            userId = yepcutoffs.userId,
            sponsorId = yepcutoffs.sponsorId,
            name = yepcutoffs.name,
            email = yepcutoffs.email,
            createdAt = yepcutoffs.createdAt,
        },
        userId = yepcutoffs.userId,
        sponsorId = yepcutoffs.sponsorId,
        name = yepcutoffs.name,
        email = yepcutoffs.email,
        createdAt = yepcutoffs.createdAt,
    }`;
  }
}

export { YepCutoffs };
