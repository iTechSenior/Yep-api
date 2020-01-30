import { AbstractIndexCreationTask } from 'ravendb';

class Leads extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from Lead in docs.Leads
    select new {
        Lead.ip,
        Lead.uuid,
        Lead.name,
        Lead.email
    }`;
  }
}

export { Leads };
