import { AbstractIndexCreationTask } from 'ravendb';

class TotalEscapeBucksByUserId extends AbstractIndexCreationTask {
  public constructor() {
    super();

    this.map = `from e in docs.EscapeBucks
    select new
    {   userId = e.user.id,
        e.bucks,
    }`;

    this.reduce = `from result in results
    group result by new { result.userId} into g
    select new
    {
      userId = g.Key.userId,
      bucks = g.Sum(x => x.bucks),
    }`;
  }
}

export { TotalEscapeBucksByUserId };
