import * as uuid from 'uuid';
import Mailchimp = require('mailchimp-api-v3');
import { Certificate } from '@/types/certificate';
import { IDocumentSession } from 'ravendb';
import { capitalizeEachFirstLetter, getNowUtc, sendInvitation, sendYepInvitation, createAndSendException, getShortUuid } from './utils';
import { Exception } from '@/types/exception';
import { User, UserReference } from '@/types/user';
import { DeliveryMethod } from '@/types/Enums';
import { findMailChimpUserByEmail } from './mailchimp';
import { AddProspectArgs, Prospect } from '@/types/prospect';
import { YepProspect, YepProspectInput, YepProspectReceiver } from '@/types/yepProspect';
import { Contact } from '@/types/contact';
import { ContactEmail } from '@/types/contactEmail';
import { initializeStore } from '../db';
import * as gravatar from 'gravatar';
import { ContactStatusEnum } from '@/types/contact/Enum';
import { YepProspectSharedContentInput } from '@/types/yepProspect/YepProspectInput';
const mailchimp = new Mailchimp('219bb27c95c1805b4035cd54492a884b-us12');

export const addYepProspectAndSendEmails = async (session: IDocumentSession, args: YepProspectInput, userId: string) => {
  const user = await session.load<User>(userId);
  const store = await initializeStore();
  // tslint:disable-next-line: prefer-const
  let contacts: Contact[] = [];
  // tslint:disable-next-line: prefer-const
  let contactEmails: ContactEmail[] = [];
  let contact: Contact;
  let contactEmail: ContactEmail;
  args.receivers.map(async receiver => {
    const firstName = receiver.firstName;
    const lastName = receiver.lastName;
    const deliveryEndpoint = receiver.deliveryEndpoint;

    contact = new Contact(
      uuid.v4(),
      new UserReference(user.id, user.email, user.firstName, user.lastName),
      capitalizeEachFirstLetter(firstName),
      capitalizeEachFirstLetter(lastName),
      deliveryEndpoint.toLowerCase().trim(),
      args.categoryId,
      true
    );
    contacts.push(contact);
  });

  // tslint:disable-next-line: prefer-const
  let tryBulkUpdate = store.bulkInsert();
  let countSentEmail = 0;

  for (const contact of contacts) {
    await tryBulkUpdate.store(contact, contact.id);
    const yepProspect = new YepProspect(contact.firstName, contact.lastName, contact.email, args.categoryId, args.personalizedMessage);
    const result = await sendYepInvitation(yepProspect, user);
    countSentEmail++;
    contactEmail =
      result && result.success
        ? (contactEmail = new ContactEmail(contact.id, getNowUtc(), contact.email, args.personalizedMessage, args.categoryId, true))
        : (contactEmail = new ContactEmail(contact.id, getNowUtc(), contact.email, args.personalizedMessage, args.categoryId, false));
    contactEmails.push(contactEmail);

    if (countSentEmail === contacts.length) {
      // tslint:disable-next-line: prefer-const
      let tryBulkUpdateContactEmail = store.bulkInsert();
      for (const contactEmail of contactEmails) {
        await tryBulkUpdateContactEmail.store(contactEmail, contactEmail.id);
      }
      await tryBulkUpdateContactEmail.finish();
    }
  }
  await tryBulkUpdate.finish();

  return { success: true };
};

export const addProspectAndSendEmail = async (
  session: IDocumentSession,
  args: AddProspectArgs,
  userId: string,
  listIdMailChimp?: string,
  customer?: boolean,
  tags: string[] = ['Optin']
): Promise<Prospect> => {
  // tslint:disable-next-line: prefer-const
  let prospect: Prospect;
  try {
    if (listIdMailChimp) {
      mailchimp
        .post(`/lists/${listIdMailChimp}/members`, {
          email_address: args.deliveryEndpoint.toLowerCase().trim(),
          status: 'subscribed',
          merge_fields: { FNAME: args.firstName, LNAME: args.lastName, PHONE: args.phone },
          tags,
        })
        .then(res => {})
        .catch(err => {
          const error = new Exception(null, null, 'addProspectAndSendEmail error trying to insert the user email in the mailChimp list', err, args);
          session.store(error);
          session.saveChanges();
        });
    }

    return await sendCertificateEmail(session, args, userId, listIdMailChimp);
  } catch (ex) {
    const error = new Exception(null, null, new Error(ex.message).stack, ex.message, args);
    await session.store(error);
    await session.saveChanges();
    throw new Error('There was an error. Please try again. The Tech team has been notified.');
  }
};

export const sendCertificateEmail = async (
  session: IDocumentSession,
  args: AddProspectArgs,
  userId: string = 'users/1-A',
  listIdMailChimp?: string
): Promise<Prospect> => {
  let certificate: Certificate;
  let prospect: Prospect;

  certificate = await session.load<Certificate>(args.certificateId);
  const user = await session.load<User>(userId);
  if (args.id) {
    prospect = await session.load<Prospect>(args.id);
  } else {
    prospect = new Prospect(
      null,
      getShortUuid(),
      userId,
      capitalizeEachFirstLetter(args.firstName),
      capitalizeEachFirstLetter(args.lastName),
      args.deliveryEndpoint.toLowerCase().trim(),
      args.deliveryMethod,
      [],
      certificate,
      args.personalizedMessage || certificate.defaultMessage
    );
    prospect.createdAt = getNowUtc();
    await session.store(prospect);
  }
  prospect.updatedAt = getNowUtc();
  await session.saveChanges();

  try {
    if (args.deliveryMethod === 'Email') {
      sendInvitation(prospect, certificate, user, !listIdMailChimp);
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
  }
  await session.saveChanges();

  return prospect;
};

export const saveYepSharedContentProspect = async (session: IDocumentSession, args: YepProspectSharedContentInput, userId: string) => {
  const user = await session.load<User>(userId);
  // tslint:disable-next-line: prefer-const
  let contacts: Contact[] = [];
  const { id, firstName, lastName, deliveryEndpoint } = args.prospect;

  const contact = new Contact(
    uuid.v4(),
    new UserReference(user.id, user.email, user.firstName, user.lastName),
    capitalizeEachFirstLetter(firstName),
    capitalizeEachFirstLetter(lastName),
    deliveryEndpoint.toLowerCase().trim(),
    args.contentId,
    false,
    ContactStatusEnum.Unsubscribe
  );

  // tslint:disable-next-line: prefer-const
  const yepProspect = new YepProspect(contact.firstName, contact.lastName, contact.email, args.contentId, args.personalizedMessage);

  await session.store(contact);
  await session.store(yepProspect);
  await session.saveChanges();

  return { success: true };
};
