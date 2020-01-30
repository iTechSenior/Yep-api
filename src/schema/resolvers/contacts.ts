import { v4 } from 'uuid';
import * as moment from 'moment';
import { Context } from '../../helpers/interfaces';
import {
  getNowUtc,
  sendUnlimitedCertificatesLink,
  sendSfxCertificateLink,
  Roles,
  verifyAccess,
  createAndSendException,
  sendInvitation,
  getIp,
  sendCertificate,
  capitalizeEachFirstLetter,
  formatSearchTerm,
} from '@/helpers/utils';
// import { createWriteStream } from 'fs';
import * as path from 'path';
import * as gravatar from 'gravatar';
import { find } from 'lodash';
import * as fs from 'fs';
import { Resolver, Arg, Ctx, Mutation, Args, Query } from 'type-graphql';
import { BooleanResponse } from '@/types/common/BooleanResponse';
import { UploadContactList, Contact } from '@/types/contact';
import { SendContactMailInput, SubscribeInput, ContactEmail } from '@/types/contactEmail';
import { IDocumentQuery, QueryStatistics } from 'ravendb';
import { ProspectBasics, ProspectBasicsPagination, Prospect } from '@/types/prospect';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { initializeStore } from '../../db/index';
import { User, UserReference } from '@/types/user';
import { from } from 'apollo-link';
import { ContactStatus } from '@/types/Enums';
import { ContactStatusEnum } from '@/types/contact/Enum';

// tslint:disable-next-line:variable-name
const node_xj = require('xls-to-json');
const AWS = require('aws-sdk');

const storeUpload = (stream: any, filename: string) =>
  new Promise((resolve, reject) =>
    stream
      .pipe(fs.createWriteStream(filename))
      .on('finish', () => resolve())
      .on('error', reject)
  );

const getTemplateName = (template: string) => {
  if (template === 'Insurance Professionals') return 'InsuranceTemplate';
  if (template === 'Realtors') return 'RealtorsTemplate';
  if (template === 'Business Owners') return 'BusinessOwnerTemplate';
  if (template === 'Affiliate Opportunity/Give Vacations away') return 'VacationsAwayTemplate';
  if (template === 'Travel Membership Only') return 'TravelMembershipOnlyTemplate';
};

@Resolver(() => Contact)
export class ContactResolver {
  @Query(() => ProspectBasicsPagination)
  async getContactsByAffiliate(
    @Args() { searchText, skip, pageSize }: TablePaginationWithSearchTextArgs,
    @Ctx() { session, req }: Context
  ): Promise<ProspectBasicsPagination> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic, Roles.Administrator]);
    let stats: QueryStatistics;
    let query: IDocumentQuery<any>;
    let prospects: Prospect[];
    query = session.query<Prospect>({ indexName: 'Prospects' }).whereEquals('userId', req.user.id);
    if (searchText) {
      const searchTerm = formatSearchTerm(searchText.split(' '));
      query.andAlso().search('Query', searchTerm, 'AND');
    }
    prospects = await query
      .statistics(s => (stats = s))
      .take(pageSize)
      .skip(skip)
      .all();

    return { prospects, totalRows: stats.totalResults };
  }

  @Mutation(() => BooleanResponse)
  async uploadContactList(@Arg('args') args: UploadContactList, @Ctx() { req, session }: Context): Promise<BooleanResponse> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic, Roles.Affiliate, Roles.Administrator]);
    const { createReadStream, filename } = await args.file;
    const filePath = path.resolve(`./src/${filename}`);
    const store = await initializeStore();
    const stream = createReadStream();
    await storeUpload(stream, filePath);
    const getLocationsFromExcel = (sheet: string, filename: string): Promise<any[]> => {
      return new Promise((resolve, reject) => {
        node_xj(
          {
            input: filePath,
            output: null,
            sheet: sheet,
          },
          async (err: Error, result: any[]) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    };
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    const userId = req.user.id;
    const user: User = await session.load<User>(userId);
    let customers = await getLocationsFromExcel('Sheet1', filePath);
    customers = customers.slice(0, 500);
    const contacts: Contact[] = [];
    const contactEmails: ContactEmail[] = [];
    let contact: Contact;
    let contactEmail: ContactEmail;
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    for (const customer of customers) {
      const firstName = customer['First Name'];
      const lastName = customer['Last Name'];
      const deliveryEndpoint = customer['Email'];
      contact = new Contact(
        v4(),
        new UserReference(user.id, user.email, user.firstName, user.lastName),
        capitalizeEachFirstLetter(firstName),
        capitalizeEachFirstLetter(lastName),
        deliveryEndpoint.toLowerCase().trim(),
        args.template,
        true,
        ContactStatusEnum.Denied
      );
      contacts.push(contact);
    }
    const tryBulkUpdate = store.bulkInsert();
    let countSentEmail = 0;
    for (const contact of contacts) {
      await tryBulkUpdate.store(contact, contact.id);
      const data = {
        contactFirstName: contact.firstName,
        memberName: `${user.firstName} ${user.lastName}`,
        gravatarUrl: gravatar.url(user.email, { s: '80', d: 'mp' }, false),
        uuid: contact.uuid,
      };
      const params = {
        Source: 'TripValet Incentives<info@tripvaletincentives.com>',
        Template: 'PermissionTemplate',
        Destination: {
          ToAddresses: [contact.email],
        },
        ReplyToAddresses: [user.email],
        TemplateData: JSON.stringify(data),
      };
      ses.sendTemplatedEmail(params, async (err: Error, data: any) => {
        countSentEmail++;
        if (err) {
          contactEmail = new ContactEmail(contact.id, getNowUtc(), contact.email, args.message, args.template, false);
          // console.log(err);
        } else {
          contactEmail = new ContactEmail(contact.id, getNowUtc(), contact.email, args.message, args.template, true);
        }
        contactEmails.push(contactEmail);
        if (countSentEmail === contacts.length) {
          const tryBulkUpdateContactEmail = store.bulkInsert();
          for (const contactEmail of contactEmails) {
            await tryBulkUpdateContactEmail.store(contactEmail, contactEmail.id);
          }
          await tryBulkUpdateContactEmail.finish();
        }
      });
    }
    await tryBulkUpdate.finish();
    fs.unlink(filePath, err => {
      if (err) {
        console.error(err);
      }
    });

    return { success: true };
  }

  @Mutation(() => BooleanResponse)
  async sendContactMail(@Arg('args') args: SendContactMailInput, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const contact: Contact = await session
      .query<Contact>({ collection: 'Contacts' })
      .whereEquals('uuid', args.uuid)
      .firstOrNull();
    // Decline
    if (!args.accept) {
      contact.status = ContactStatusEnum.Denied;
      await session.store(contact);
      await session.saveChanges();
      return { success: true };
    }
    const user = await session.load<User>(contact.user.id);
    const contactEmail = await session
      .query<ContactEmail>({ indexName: 'ContactEmails' })
      .whereEquals('contactId', contact.id)
      .firstOrNull();
    const data = {
      contactFirstName: contact.firstName,
      message: contactEmail.message,
      memberFirstName: contact.user.firstName,
      memberName: `${contact.user.firstName} ${contact.user.lastName}`,
      affiliateUrl: `https://${user.username}.mytripvalet.com/incentives/`,
      gravatarUrl: gravatar.url(contact.user.email, { s: '80', d: 'mp' }, false),
      uuid: contact.uuid,
    };
    const params = {
      Source: 'TripValet Incentives<info@tripvaletincentives.com>',
      Template: getTemplateName(contact.tag),
      Destination: {
        ToAddresses: [contact.email],
      },
      ReplyToAddresses: [contact.user.email],
      TemplateData: JSON.stringify(data),
    };
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    const ses = new AWS.SES({ apiVersion: '2010-12-01' });
    ses.sendTemplatedEmail(params, async (err: Error, data: any) => {
      if (err) {
        // console.log(err);
      } else {
      }
    });
    contact.status = ContactStatusEnum.Subscribe;
    await session.store(contact);
    await session.saveChanges();
    return { success: true };
  }

  @Mutation(() => BooleanResponse)
  async subscribe(@Arg('args') args: SubscribeInput, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const contact = await session
      .query<Contact>({ collection: 'Contacts' })
      .whereEquals('email', args.email)
      .firstOrNull();
    if (!contact) return { success: false };
    contact.subscribe = true;
    contact.status = ContactStatusEnum.Subscribe;
    await session.store(contact);
    await session.saveChanges();
    return { success: true };
  }

  @Mutation(() => BooleanResponse)
  async unsubscribe(@Arg('args') args: SubscribeInput, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const contact = await session
      .query<Contact>({ collection: 'Contacts' })
      .whereEquals('email', args.email)
      .firstOrNull();
    if (!contact) return { success: false };
    contact.subscribe = false;
    contact.status = ContactStatusEnum.Unsubscribe;
    await session.store(contact);
    return { success: true };
  }
}
