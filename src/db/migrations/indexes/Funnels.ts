import { AbstractIndexCreationTask } from 'ravendb';

class Funnels extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from funnel in docs.Funnels
    from funnelStep in funnel.funnelSteps
    select new {
        url = funnelStep.url,
        stepOrder = funnelStep.stepOrder,
        title = funnel.title,
        active = funnel.active,
        domain = funnel.domain.tld,
        hidden = funnel.hidden,
        pastUrls = funnel.pastUrls
    }`;
  }
}

export { Funnels };
