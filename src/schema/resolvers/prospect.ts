import { Resolver, Query, Arg, Ctx, Mutation, Args } from 'type-graphql';
import {
  capitalizeEachFirstLetter,
  formatSearchTerm,
  getNowUtc,
  createAndSendException,
  sendSfxCertificateLink,
  sendUnlimitedCertificatesLink,
  sendCertificate,
} from '@/helpers/utils';
import { Certificate, SfxCertificateOrderRequest } from '@/types/certificate';
import { Context } from '@/helpers/interfaces';
import {
  Prospect,
  AddProspectArgs,
  AddMultipleProspects,
  ProspectBasicsPagination,
  ProspectBasics,
  ProspectInput,
  SendProspectEmail,
  GetProspectByUuid,
} from '@/types/prospect';
import { Exception } from '@/types/exception';
import { addProspectAndSendEmail, addYepProspectAndSendEmails, saveYepSharedContentProspect } from '@/helpers/prospect';
import { BooleanResponse } from '@/types/common/BooleanResponse';
import { initializeStore } from '../../db';
import * as fs from 'fs';
import { DeliveryMethod } from '@/types/Enums';
import uuid = require('uuid');
import gravatar = require('gravatar');
import * as sfx from '../../helpers/sfx';
import { User } from '@/types/user';
import { find } from 'lodash';
import moment = require('moment');
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { QueryStatistics, IDocumentQuery } from 'ravendb';
import { DumpBucket } from '@/types/dumpBucket';
import { getLocationsFromExcel } from '@/helpers/excel';
import { ProspectTableResult } from '@/types/prospect/ProspectTableResult';
import { YepProspectInput, YepProspectReceiver } from '@/types/yepProspect';
import { YepProspectSharedContentInput } from '@/types/yepProspect/YepProspectInput';

// tslint:disable-next-line: variable-name
const node_xj = require('xls-to-json');
const AWS = require('aws-sdk');

const storeUpload = (stream: any, filename: string) =>
  new Promise((resolve, reject) =>
    stream
      .pipe(fs.createWriteStream(filename))
      .on('finish', () => resolve())
      .on('error', reject)
  );

const sendSESEmail = (prospect: Prospect, certificate: Certificate, user: User, firstName: string, lastName: string, deliveryEndpoint: string) => {
  const ses = new AWS.SES({ apiVersion: '2010-12-01' });
  const data = {
    name: firstName,
    title: certificate.title,
    memberName: `${user.firstName} ${user.lastName}`,
    url: `https://incentives.tripvalet.com/gift/${prospect.uuid}`,
    year: new Date().getFullYear().toString(),
    destinations: certificate.destinations,
    certImageUrl: find(certificate.images, { type: 'Email', displayOrder: 1 }).url,
    message: prospect.personalizedMessage,
    expires: moment()
      .add(30, 'days')
      .format('MM/DD/YYYY'),
    photo:
      'https://marketing-image-production.s3.amazonaws.com/uploads/14080212826cb34f4a4eddc257c822db30a1696e19a266c82e301f5d76940e1486121e40c91ce160eaadc7c9a65aa6efde0d974b329befdf96217c0f828370b0.png',
    gravatarUrl: gravatar.url(user.email, { s: '80', d: 'mp' }, false),
    redemptionUrl: certificate.redemptionUrl,
  };
  const templateData = JSON.stringify(data);
  const params = {
    Source: 'TripValet Incentives<info@tripvaletincentives.com>',
    Template: 'ProspectTemplate',
    Destination: {
      ToAddresses: [deliveryEndpoint],
    },
    ReplyToAddresses: [user.email],
    TemplateData: templateData,
  };
  ses.sendTemplatedEmail(params, (err: Error, data: string) => {
    if (err) {
      // console.log(err, err.stack);
    }
    // an error occurred
    else {
      // console.log(data); // successful response
    }
  });
};

@Resolver(() => Prospect)
export class ProspectResolver {
  @Query(() => Prospect)
  async getProspectByUuid(@Args() { uuid }: GetProspectByUuid, @Ctx() { session }: Context): Promise<Prospect> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const prospect: Prospect = await session
      .query<Prospect>({ collection: 'Prospects' })
      .whereEquals('uuid', uuid)
      .firstOrNull();
    return prospect;
  }

  @Query(() => ProspectTableResult)
  async getProspectsByAffiliate(
    @Args() { searchText, skip, pageSize }: TablePaginationWithSearchTextArgs,
    @Ctx() { session, req }: Context
  ): Promise<ProspectTableResult> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    let stats: QueryStatistics;
    const query: IDocumentQuery<Prospect> = session
      .query<Prospect>({ indexName: 'Prospects' })
      .statistics(s => (stats = s))
      .take(pageSize)
      .skip(skip)
      .whereEquals('userId', req.user.id)
      .orderByDescending('createdAt');

    if (searchText) {
      const searchTerm = formatSearchTerm(searchText.split(' '));
      query.andAlso().search('Query', searchTerm, 'AND');
    }

    const prospects = await query.all();
    return { prospects, totalRows: stats.totalResults };
  }

  @Mutation(() => Prospect)
  async addProspect(@Args(() => AddProspectArgs) args: AddProspectArgs, @Ctx() { req, session }: Context): Promise<Prospect> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);

    try {
      return await addProspectAndSendEmail(session, args, req.user.id);
    } catch (ex) {
      const error = new Exception(null, null, new Error(ex.message).stack, ex.message, args);
      await session.store(error);
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech team has been notified.');
    }
  }

  @Mutation(() => BooleanResponse)
  async addYepProspect(@Arg('args') args: YepProspectInput, @Ctx() { req, session }: Context): Promise<BooleanResponse> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      return await addYepProspectAndSendEmails(session, args, req.user.id);
    } catch (ex) {
      const error = new Exception(null, null, new Error(ex.message).stack, ex.message, args);
      await session.store(error);
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech team has been notified.');
    }
  }

  @Mutation(() => BooleanResponse)
  async addYepSharedContentProspect(@Arg('args') args: YepProspectSharedContentInput, @Ctx() { req, session }: Context): Promise<BooleanResponse> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      return await saveYepSharedContentProspect(session, args, req.user.id);
    } catch (ex) {
      const error = new Exception(null, null, new Error(ex.message).stack, ex.message, args);
      await session.store(error);
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech team has been notified.');
    }
  }

  @Mutation(() => BooleanResponse)
  async addMultipleProspects(@Arg('args', () => AddMultipleProspects) args: AddMultipleProspects, @Ctx() { req, session }: Context): Promise<BooleanResponse> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const store = await initializeStore();

    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    const userId = req.user.id;
    const certificate: Certificate = await session.load<Certificate>(args.certificateId);
    const user = await session.load<User>(userId);

    const customers = args.customers;
    const prospects = [];
    let prospect: Prospect;

    for (const customer of customers) {
      const firstName = customer.firstName;
      const lastName = customer.lastName;
      const deliveryEndpoint = customer.deliveryEndpoint;
      prospect = new Prospect(
        null,
        uuid.v1(),
        userId,
        capitalizeEachFirstLetter(firstName),
        capitalizeEachFirstLetter(lastName),
        deliveryEndpoint.toLowerCase().trim(),
        DeliveryMethod.Email,
        [],
        certificate,
        args.personalizedMessage || certificate.defaultMessage!
      );
      prospect.createdAt = getNowUtc();
      prospect.updatedAt = getNowUtc();
      prospects.push(prospect);

      sendSESEmail(prospect, certificate, user, firstName, lastName, deliveryEndpoint);
    }

    const tryBulkUpdate = store.bulkInsert();
    for (const prospect of prospects) {
      await tryBulkUpdate.store(prospect, prospect.id);
    }
    await tryBulkUpdate.finish();

    return { success: true };
  }

  @Mutation(() => BooleanResponse)
  async sendProspectEmail(@Arg('args') args: SendProspectEmail): Promise<BooleanResponse> {
    const { receiverEmail, replyEmail, senderFirstName, senderLastName, message } = args;

    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    const data = {
      memberName: `${senderFirstName} ${senderLastName}`,
      gravatarUrl: gravatar.url(replyEmail, { s: '80', d: 'mp' }, false),
      message,
    };
    const templateData = JSON.stringify(data);
    const params = {
      Source: 'TripValet Incentives<info@tripvaletincentives.com>',
      Template: 'ProspectTemplate',
      Destination: {
        ToAddresses: [receiverEmail],
      },
      ReplyToAddresses: [replyEmail],
      TemplateData: templateData,
    };
    ses.sendTemplatedEmail(params, (err: Error, data: any) => {
      if (err) {
        // console.log(err);
      }
      // an error occurred
      else {
        // console.log(data); // successful response
      }
    });
    return { success: true };
  }

  @Mutation(() => Prospect)
  async acceptProspectCertificate(@Arg('args') args: ProspectInput, @Ctx() { session }: Context): Promise<Prospect> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      let prospect = await session
        .query<Prospect>({ collection: 'Prospects' })
        .whereEquals('uuid', args.uuid)
        .firstOrNull();

      if (!prospect) {
        return null;
      }

      const user = await session.load<User>(prospect.userId);

      // prospect.visits.push(new Visit(new Date(), getIp(req), req.url));
      prospect = {
        ...prospect,
        firstName: args.firstName,
        lastName: args.lastName,
        deliveryEndpoint: args.deliveryEndpoint,
        deliveryMethod: DeliveryMethod.Email,
        redeemed: true,
        updatedAt: getNowUtc(),
      };
      await session.saveChanges();

      try {
        const certificate = await session.load<Certificate>(prospect.certificate.id);
        switch (certificate.vendor) {
          case 'Assured Travel':
            if (certificate.sfx) {
              try {
                const response = await sfx.requestSfxCertificate(
                  new SfxCertificateOrderRequest(certificate.sfx.offer_id, prospect.userId, prospect.deliveryEndpoint, prospect.id)
                );
                if (response) {
                  prospect.sfx = response;
                  const dump = new DumpBucket(null, 'Prospects > RequestCertificate', {
                    location: {
                      message: 'SFX Certificate Order Response',
                      function: 'prospects.ts > assuredTravel.requestCertificate()',
                    },
                    prospect,
                    response,
                  });
                  await session.store(dump);
                  await session.saveChanges();

                  if (response.status !== 1) {
                    await session.store(
                      await createAndSendException(
                        null,
                        prospect.id,
                        new Error(response.error).stack,
                        { response, errorMessage: response.error, user, prospect, certificate, args },
                        true
                      )
                    );
                    await session.saveChanges();
                  }

                  await sendSfxCertificateLink(prospect, user, response.certs[0].code);
                }
              } catch (ex) {
                await session.store(
                  await createAndSendException(null, prospect.id, new Error(ex.message).stack, {
                    errorMessage: ex.message,
                    user,
                    prospect,
                    certificate,
                    args,
                  })
                );
                await session.saveChanges();
              }
            }
            break;

          case 'Unlimited Certificates':
            await sendUnlimitedCertificatesLink(prospect, user);
            break;

          default:
            const cmiResponse = await sendCertificate(prospect);
            if (!cmiResponse.sent) {
              await session.store(
                await createAndSendException(
                  prospect.id,
                  new Error(cmiResponse.message).stack,
                  cmiResponse.message,
                  {
                    location: {
                      function: 'prospects.ts > acceptProspectCertificate()',
                      location: 'await sendCertificate(prospect)',
                    },
                    data: cmiResponse.data,
                    prospect,
                  },
                  true
                )
              );
              await session.saveChanges();
            }
            break;
        }
      } catch (ex) {
        await session.store(await createAndSendException(prospect.id, new Error(ex.message).stack, ex.message, prospect));
        await session.saveChanges();
      }
      return prospect;
    } catch (ex) {
      const error = new Exception(null, null, new Error(ex.message).stack, ex.message, args);
      await session.store(error);
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech team has been notified.');
    }
  }
}
