import { v4 } from 'uuid';
import { Query, Args, Resolver, Ctx, Arg } from 'type-graphql';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { User } from '@/types/user';
import { DomainReference } from '@/types/domain';
import { Roles, verifyAccess, sendExceptionViaEmail, createAndSendException } from '@/helpers/utils';
import { DumpBucket } from '@/types/dumpBucket';
import { find, remove } from 'lodash';
import { UserBasics } from '@/types/user/UserBasics';
import { Lead } from '@/types/lead/Lead';
import { LeadVisit } from '@/types/lead/LeadVisit';
import { Funnel, FunnelReference } from '@/types/funnel';
import { FunnelStepReference } from '@/types/funnel/FunnelStepReference';
import { Context } from '@/helpers/interfaces';
import { FunnelStepArgs } from '@/types/funnel/FunnelStepArgs';
import { FunnelStep } from '@/types/funnel/FunnelStep';
import { FunnelStepWithData } from '@/types/funnel/FunnelStepWithData';
import shortid = require('shortid');
import { Exception } from '@/types/exception';

@Resolver()
export class FunnelResolver {
  @Query(() => [Funnel])
  async getAllFunnels(@Args() { skip, pageSize }: TablePaginationWithSearchTextArgs, @Ctx() { session, req }: Context): Promise<Funnel[]> {
    verifyAccess(req, [Roles.Administrator]);
    return session
      .query<Funnel>({ collection: 'Funnels' })
      .skip(skip)
      .take(pageSize)
      .all();
  }

  @Query(() => [Funnel])
  async getAllFunnelsForAffiliateLinks(
    @Args() { skip, pageSize, searchText }: TablePaginationWithSearchTextArgs,
    @Ctx() { session, req }: Context
  ): Promise<Funnel[]> {
    verifyAccess(req, [Roles.Administrator]);
    return session
      .query<Funnel>({ collection: 'Funnels' })
      .whereEquals('hidden', false)
      .skip(skip)
      .take(pageSize)
      .all();
  }

  @Query(() => [Funnel])
  async getFunnelById(@Arg('id') id: string, @Ctx() { session, req }: Context): Promise<Funnel> {
    verifyAccess(req, [Roles.Administrator]);
    return session.load<Funnel>(id);
  }

  @Query(() => FunnelStepWithData)
  async getFunnelStepWithData(@Args() { luid, path, aid, host }: FunnelStepArgs, @Ctx() { session, req }: Context): Promise<FunnelStepWithData> {
    let lead: Lead | null = null;
    let segments: string[] = [];
    let url = host ? host : req.headers['origin'] ? <string>req.headers['origin'] : <string>req.headers['referer'];

    try {
      if (!url) {
        url = 'yeptribe.com';
      }

      // url = 'yeptribefreedom.com';
      const dumpBucket = new DumpBucket(null, 'getFunnelStepWithData > args and req', {
        url,
        host,
        luid,
        path,
        aid,
        reqUrl: req.url,
        baseUrl: req.baseUrl,
        originalUrl: req.originalUrl,
        hostname: req.hostname,
        headers: req.headers,
      });
      await session.store(dumpBucket);
      await session.saveChanges();

      const matchDomain = /troyzarger\.me|mytripvalet.com|cicerotravelclub.com|yeptribe.com|yeptribefreedom.com/g;
      const match = matchDomain.exec(url);
      const domain = match.length > 0 ? match[0] : 'yeptribe.com';

      const funnel = await session
        .query<Funnel>({ indexName: 'Funnels' })
        .whereEquals('domain', domain)
        .whereEquals('url', path)
        .firstOrNull();

      // console.log('funnel', funnel);

      if (!funnel) return null;
      const funnelStep: FunnelStep = find<FunnelStep>(funnel.funnelSteps, step => {
        return step.url === path;
      });

      const protocolMatch = /^(https?):\/\//;
      url = url.replace(protocolMatch, '');
      segments = url.split('.');
      remove(segments, (segment: any) => {
        return segment.toLowerCase() === 'www';
      });

      if (segments[0] === 'localhost:3000') segments[0] = 'troyzarger';
      const user = await session
        .query<User>({ indexName: 'Users' })
        .whereEquals('username', segments[0])
        .orElse()
        .whereEquals('uuid', segments[0])
        .selectFields(['id', 'firstName', 'lastName', 'email', 'uuid'])
        .ofType<UserBasics>(UserBasics)
        .firstOrNull();

      if (luid) {
        lead = await session
          .query<Lead>({ indexName: 'Leads' })
          .whereEquals('uuid', luid)
          .firstOrNull();
      }

      if (lead === null) {
        lead = new Lead(
          new FunnelReference(funnel.id, funnel.title),
          new FunnelStepReference(funnelStep.stepOrder, funnelStep.url),
          new DomainReference(funnel.domain.id, funnel.domain.tld),
          shortid.isValid(segments[0]) ? segments[0] : v4(),
          req.headers['x-real-ip'] ? <string>req.headers['x-real-ip'] : <string>req.headers['x-forwarded-for'],
          null,
          null,
          user ? user.id : null
        );
        await session.store(lead);
        await session.saveChanges();

        const leadDump = new DumpBucket(null, 'getFunnelStepWithData > new lead', { lead, host, luid, path, aid, user });
        await session.store(leadDump);
      }

      const visit = new LeadVisit(
        lead.id,
        new FunnelReference(funnel.id, funnel.title),
        new FunnelStepReference(funnelStep.stepOrder, funnelStep.url),
        new DomainReference(funnel.domain.id, funnel.domain.tld),
        req.headers['x-real-ip'] ? <string>req.headers['x-real-ip'] : <string>req.headers['x-forwarded-for'],
        user ? user.id : null
      );
      await session.store(visit);
      await session.saveChanges();
      const result = { fid: funnel.id, funnelStep, affiliate: user, luid: lead.uuid };

      const returnResult = new DumpBucket(null, 'getFunnelStepWithData > result', {
        result,
        segments,
        url,
        host,
        luid,
        path,
        aid,
      });
      await session.store(returnResult);
      await session.saveChanges();

      return result;
    } catch (ex) {
      const error = await createAndSendException(
        'getFunnelStepWithData > try/catch',
        new Error(ex.message).stack,
        ex.message,
        {
          host,
          luid,
          path,
          aid,
          message: ex.message,
          lead,
          url,
          segments,
        },
        true
      );
      await session.store(error);
      await session.saveChanges();
    }
  }
}
