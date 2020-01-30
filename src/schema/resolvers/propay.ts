import { ProPaySignupResponse, ProPayInput, ProPayAccountNumberInput, ProPayCommissionInput, ProPayAccount, ProPayDisburseFund } from '@/types/propay';
import { BooleanResponse } from '@/types/common/BooleanResponse';
import { Resolver, Mutation, Arg, Ctx, Args, Query } from 'type-graphql';
import { Context } from '@/helpers/interfaces';
import { APIMessageResponse } from '@/types/common';
import { User } from '@/types/user/User';
import { Commission } from '@/types/commission';
import { sendProPaySignupEmail, Roles } from '@/helpers/utils';
import { EmailAddress } from '@sendgrid/helpers/classes';
import { uniq } from 'lodash';
const builder = require('xmlbuilder');
const axios = require('axios');
const parser = require('fast-xml-parser');
const he = require('he');

const options = {
  attributeNamePrefix: '@_',
  attrNodeName: 'attr', // default is 'false'
  textNodeName: '#text',
  ignoreAttributes: true,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: false,
  trimValues: true,
  cdataTagName: '__cdata', // default is 'false'
  cdataPositionChar: '\\c',
  localeRange: '', // To support non english character in tag/attribute values.
  parseTrueNumberOnly: false,
  attrValueProcessor: (a: any) => he.decode(a, { isAttributeValue: true }), // default is a=>a
  tagValueProcessor: (a: any) => he.decode(a), // default is a=>a
};

@Resolver()
export class ProPayResolver {
  @Query(() => ProPayAccount)
  async getProPayAccountNumber(@Ctx() { session, req }: Context): Promise<ProPayAccount> {
    const user: User = await session.load<User>(req.user.id);
    if (user && user.proPay && user.proPay.accountNumber) {
      return { success: true, accountNumber: user.proPay.accountNumber };
    }

    return { success: false };
  }

  @Mutation(() => ProPaySignupResponse)
  async proPaySignup(@Arg('args') args: ProPayInput, @Ctx() { session, req }: Context): Promise<ProPaySignupResponse> {
    const { firstName, lastName, dayOfBirth, ssn, sourceEmail, dayPhone, evenPhone, address, city, state, zip, country } = args;
    const obj = {
      XMLRequest: {
        certStr: {
          '#text': process.env.PROPAY_ACCOUNTBOARDING_CERTSTR,
        },
        termid: {
          '#text': process.env.PROPAY_ACCOUNTBOARDING_TERMID,
        },
        class: {
          '#text': 'partner',
        },
        XMLTrans: {
          transType: {
            '#text': '01',
          },
          firstName: {
            '#text': firstName,
          },
          lastName: {
            '#text': lastName,
          },
          dob: {
            '#text': dayOfBirth,
          },
          ssn: {
            '#text': ssn
              .replace('-', '')
              .padStart(9, '0')
              .substr(0, 9),
          },
          sourceEmail: {
            '#text': sourceEmail,
          },
          dayPhone: {
            '#text': dayPhone,
          },
          evenPhone: {
            '#text': evenPhone,
          },
          addr: {
            '#text': address,
          },
          addr3: {
            '#text': `${city}, ${state} ${zip}`.substr(0, 100),
          },
          city: {
            '#text': city,
          },
          state: {
            '#text': state,
          },
          zip: {
            '#text:': zip,
          },
          country: {
            '#text:': country,
          },
        },
      },
    };

    const xml = builder.create(obj).end({ pretty: true });
    let transType, status, accountNumber, password, success: boolean;
    try {
      await axios
        .post(process.env.PROPAY_ENDPOINT, xml, {
          headers: { 'Content-Type': 'text/xml', 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then((response: { data: any }) => {
          const xmlData = response.data;
          if (!parser.validate(xmlData)) {
            // optional (it'll return an object in case it's not valid)
            const jsonObj = parser.parse(xmlData, options);
            return;
          }
          // Intermediate obj
          const tObj = parser.getTraversalObj(xmlData, options);
          const json = parser.convertToJson(tObj, options);
          transType = json.XMLResponse.XMLTrans.transType;
          status = json.XMLResponse.XMLTrans.status;
          accountNumber = json.XMLResponse.XMLTrans.accntNum;
          password = json.XMLResponse.XMLTrans.password;

          success = true;
        })
        .catch((error: any) => {
          success = false;
          console.log(error);
        });
    } catch (error) {
      success = false;
      console.log(error);
    }

    if (!success) return { success: false, message: 'Connection error' };

    if (status === '00' || status === '66') {
      sendProPaySignupEmail(firstName, accountNumber, sourceEmail, password);
      const user = await session.load<User>(req.user.id);
      if (user) {
        user.proPay.accountNumber = accountNumber;
        user.proPay.success = true;
        user.roles = uniq([...user.roles, Roles.ProPayMember]);
        await session.saveChanges();
      }
      return { success: true, transType, status, accountNumber, password };
    } else {
      const statusCode = parseInt(status, 10);
      let message: string;
      switch (statusCode) {
        case 20:
          message = 'Invalid username';
          break;
        case 21:
          message = 'Invalid transType';
          break;
        case 24:
          message = 'Invalid sourceEmail';
          break;
        case 25:
          message = 'Invalid firstName';
          break;
        case 27:
          message = 'Invalid lastName';
          break;
        case 28:
          message = 'Invalid Addr';
          break;
        case 30:
          message = 'Invalid city';
          break;
        case 31:
          message = 'Invalid state';
          break;
        case 32:
          message = 'Invalid zip';
          break;
        case 33:
          message = 'Invalid mailAddr';
          break;
        case 38:
          message = 'Invalid dayPhone';
          break;
        case 39:
          message = 'Invalid evenPhone';
          break;
        case 40:
          message = 'Invalid ssn';
          break;
        case 41:
          message = 'Invalid dob';
          break;
        case 53:
          message = 'A ProPay account with this email address already exists AND/OR User has no account number';
          break;
        case 54:
          message = 'A ProPay account with this social security number already exists';
          break;
        case 55:
          message = 'The email address provided does not correspond to a ProPay account.';
          break;
        case 65:
          message = 'Miscellaneous error';
          break;
        case 66:
          message = 'Denied a ProPay account';
          break;
        default:
          message = 'Please check the error code at https://www.propay.com/en-US/Documents/API-Docs/ProPay-API-Appendix-B-Responses';
      }
      return { success: false, transType, status, accountNumber, password, message };
    }
  }

  @Mutation(() => BooleanResponse)
  async setProPayAccountNumber(@Args() { accountNumber }: ProPayAccountNumberInput, @Ctx() { session, req }: Context): Promise<BooleanResponse> {
    const user: User = await session.load<User>(req.user.id);
    user.proPay.accountNumber = accountNumber;
    user.proPay.success = true;
    user.roles = uniq([...user.roles, Roles.ProPayMember]);
    await session.saveChanges();

    return { success: true };
  }

  @Mutation(() => ProPayDisburseFund)
  async payCommission(@Arg('args') args: ProPayCommissionInput, @Ctx() { session, req }: Context): Promise<ProPayDisburseFund> {
    const { commissionId } = args;
    const commissionToPay: Commission = await session.load<Commission>(commissionId);
    const affiliate: User = await session.load<User>(commissionToPay.affiliate.id);
    const obj = {
      XMLRequest: {
        certStr: {
          '#text': process.env.PROPAY_COMMISSION_CERTSTR,
        },
        termid: {
          '#text': process.env.PROPAY_COMMISSION_TERMID,
        },
        class: {
          '#text': 'partner',
        },
        XMLTrans: {
          transType: {
            '#text': '02',
          },
          amount: {
            '#text': commissionToPay.commissionAmount,
          },
          recAccntNum: {
            '#text': affiliate.proPay.accountNumber,
          },
          invNum: {
            '#text:': commissionToPay.invoice.invoiceId,
          },
        },
      },
    };
    const xml = builder.create(obj).end({ pretty: true });
    let transType, invNum, status, transNum, success: boolean;
    try {
      await axios
        .post(process.env.PROPAY_ENDPOINT, xml, {
          headers: { 'Content-Type': 'text/xml', 'X-Requested-With': 'XMLHttpRequest' },
        })
        .then((response: { data: any }) => {
          const xmlData = response.data;
          if (parser.validate(xmlData) === true) {
            // optional (it'll return an object in case it's not valid)
            const jsonObj = parser.parse(xmlData, options);
            return;
          }
          // Intermediate obj
          const tObj = parser.getTraversalObj(xmlData, options);
          const json = parser.convertToJson(tObj, options);
          const jsonReponse = JSON.parse(json);
          transType = jsonReponse.XMLResponse.XMLTrans.transType;
          invNum = jsonReponse.XMLResponse.XMLTrans.invNum;
          status = jsonReponse.XMLResponse.XMLTrans.status;
          transNum = jsonReponse.XMLResponse.XMLTrans.transNum;

          success = true;
        })
        .catch((error: any) => {
          success = false;
          console.log(error);
        });
    } catch (error) {
      success = false;
      console.log(error);
    }

    if (!success) return { success: false, message: 'Connection error' };

    if (status === '00') return { success: true, invNum, status, transNum };
    else {
      const statusCode = parseInt(status, 10);
      let message: string;
      switch (statusCode) {
        case 61:
          message = 'Amount exceeds single transaction limit';
          break;
        case 62:
          message = 'Amount exceeds monthly volume limit';
          break;
        case 63:
          message = 'Insufficient funds in account';
          break;
        case 65:
          message = 'Miscellaneous error';
          break;
        case 66:
          message = 'Denied a ProPay account';
          break;
        default:
          message = 'Please check the error code at https://www.propay.com/en-US/Documents/API-Docs/ProPay-API-Appendix-B-Responses';
      }
      return { success: false, message, status };
    }
  }
}
