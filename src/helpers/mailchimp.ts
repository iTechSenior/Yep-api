import * as uuid from 'uuid';
import Mailchimp = require('mailchimp-api-v3');
import { Certificate } from '@/types/certificate';
import { IDocumentSession } from 'ravendb';
import { Prospect } from '@/types/prospect';
import { capitalizeEachFirstLetter, getNowUtc, sendInvitation, createAndSendException } from './utils';
import { Exception } from '@/types/exception';
import { User } from '@/types/user';
// tslint:disable-next-line:variable-name
const MAIlCHIMP_API = '219bb27c95c1805b4035cd54492a884b-us12';

export const updateMailChimpUser = async (
  session: IDocumentSession,
  userEmail: string,
  listIdMailChimp: string,
  interests: string[],
  customer: boolean
): Promise<any> => {
  try {
    const user = await findMailChimpUserByEmail(userEmail);

    if (user.exact_matches.total_items > 0) {
      const tags = interests.map(interest => ({ name: interest, status: 'active' }));
      await updateMailChimpTag(
        tags.concat([{ name: 'Optin', status: 'inactive' }, { name: 'Customer', status: 'active' }]),
        listIdMailChimp,
        user.exact_matches.members[0].id
      );
    }
  } catch (ex) {
    const error = new Exception(null, null, 'addProspectAndSendEmail error trying to insert the user email in the mailChimp list', ex.message);
    session.store(error);
    session.saveChanges();
  }
};

export const findMailChimpUserByEmail = async (userEmail: string): Promise<any> => {
  const mailchimp = new Mailchimp(MAIlCHIMP_API);
  return mailchimp.get(`/search-members?query=${userEmail}`);
};

export const findAllMailChimpUsers = async (listIdMailChimp: string): Promise<any> => {
  const mailchimp = new Mailchimp(MAIlCHIMP_API);
  return mailchimp.get(`/lists/${listIdMailChimp}/members?count=200`);
};

export const updateMailChimpTag = async (tags: any, listIdMailChimp: string, userHash: string): Promise<any> => {
  const mailchimp = new Mailchimp(MAIlCHIMP_API);
  return mailchimp.post(`/lists/${listIdMailChimp}/members/${userHash}/tags`, {
    tags,
  });
};

export const addToMailChimpWhenSubscribed = async (session: IDocumentSession, data: any, listIdMailChimp: string): Promise<any> => {
  const mailchimp = new Mailchimp(MAIlCHIMP_API);
  if (listIdMailChimp) {
    try {
      await mailchimp.post(`/lists/${listIdMailChimp}/members`, {
        email_address: data.email.toLowerCase().trim(),
        status: 'subscribed',
        merge_fields: { FNAME: data.firstName, LNAME: data.lastName, PHONE: data.phone },
      });
    } catch (ex) {
      await session.store(
        await createAndSendException(null, 'addToMailChimpWhenSubscribed', new Error(ex.message).stack, {
          errorMessage: ex.message,
          data,
          listIdMailChimp,
        })
      );
      await session.saveChanges();
      return null;
    }
  }
};
