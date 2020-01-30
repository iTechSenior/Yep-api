import Stripe = require('stripe');
import axios from 'axios';
import { v1 } from 'uuid';
import { GetIndexingStatusOperation } from 'ravendb';
import {
  AssuredTravelRevokeCertificateRequest,
  AssuredTravelRequestsBase,
  AssuredTravelGetProductsRequest,
  AssuredTravelGetProductsResponse,
  AssuredTravelRequestCertificateRequest,
  AssuredTravelRequestCertificateResponse,
  AssuredTravelGetCertificateActivityRequest,
  AssuredTravelGetCertificateStatusRequest,
  AssuredTravelCertificateActivityResponse,
  AssuredTravelCertificateStatusResponse,
  SfxCertificateRequest,
  SfxCertificateOrderResponse,
  SfxGetOffersResponse,
} from '../schema/types/certificate';
import * as https from 'https';
import { nonInputTypeOnVarMessage } from 'graphql/validation/rules/VariablesAreInputTypes';
import { DumpBucket } from '../schema/types/dumpBucket';
export const stripe = new Stripe(process.env.PAYMENT_API_KEY || 'sk_test_XTuTqy34lZdK2N1Hwo78Owv2');

const settings = {
  messageTypes: {
    test: 'test',
    getProducts: 'getProducts',
    requestCertificate: 'requestCertificate',
    getCertificateActivity: 'getCertificateActivity',
    getCertificateStatus: 'getCertificateStatus',
    revokeCertificate: 'revokeCertificate',
  },
};

export const test = async (data: AssuredTravelRequestsBase): Promise<any> => {
  const response = await axios.get(
    `${process.env.SFX_URL}?messagetype=${settings.messageTypes.test}&UserID=${process.env.assuredTravelUserId}&UserMessageReference=${
    data.userMessageReference
    }`
  );
  return response.data;
};

export const getProducts = async (data: AssuredTravelGetProductsRequest): Promise<AssuredTravelGetProductsResponse> => {
  const url = `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.getProducts}&UserID=${
    process.env.assuredTravelUserId}&UserMessageReference=${data.userMessageReference}`;
  const response = await axios.get(
    `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.getProducts}&UserID=${process.env.assuredTravelUserId}&UserMessageReference=${
    data.userMessageReference
    }`,
    {
      headers: { XATPARTNERTOKEN: process.env.SFX_PARTNER_TOKEN },
    }
  );
  return response.data;
};

export const getOffers = async (): Promise<SfxGetOffersResponse> => {
  const response = await axios.get(process.env.SFX_GET_OFFERS, {
    headers: { 'X-SFX-PARTNER-TOKEN': process.env.SFX_PARTNER_TOKEN },
  });
  return response.data;
};

export const requestCertificate = async (data: AssuredTravelRequestCertificateRequest): Promise<AssuredTravelRequestCertificateResponse> => {
  try {
    const url = encodeURI(
      `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.requestCertificate}&UserID=${
      process.env.assuredTravelUserId
      }&certificateTypeID=${data.certificateTypeId}&prospectID=${data.prospectID}&memberID=${data.memberId}&prospectEmailAddress=${
      data.prospectEmailAddress
      }&UserMessageReference=${data.userMessageReference}`
    );
    const response = await axios.get(url, {
      headers: { XATPARTNERTOKEN: process.env.SFX_PARTNER_TOKEN },
    });
    return response.data;
  } catch (ex) {
    throw ex;
  }
};

export const requestSfxCertificate = async (data: SfxCertificateRequest): Promise<SfxCertificateOrderResponse> => {
  try {
    const payload = {
      qty: 1,
      third_party_id: data.prospectID,
      offer_id: data.offerId,
      expiration: '12 months',
    };
    const response = await axios.post(process.env.SFX_PLACE_CERT_ORDER, payload, {
      headers: { 'X-SFX-PARTNER-TOKEN': process.env.SFX_PARTNER_TOKEN },
    });
    return response.data;
  } catch (ex) {
    throw ex;
  }
};

export const getCertificateActivity = async (
  data: AssuredTravelGetCertificateActivityRequest
): Promise<AssuredTravelCertificateActivityResponse> => {
  const response = await axios.get(
    `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.getCertificateActivity}&UserID=${process.env.assuredTravelUserId}&fromDate=${
    data.fromDate
    }&endDate=${data.endDate}&UserMessageReference=${data.userMessageReference}`
  );
  return response.data;
};

export const getCertificateStatus = async (
  data: AssuredTravelGetCertificateStatusRequest
): Promise<AssuredTravelCertificateStatusResponse> => {
  const response = await axios.get(
    `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.getCertificateStatus}&UserID=${
    process.env.assuredTravelUserId
    }&certificateNumber=${data.certificateNumber}&prospectID=${data.prospectId}&UserMessageReference=${data.userMessageReference}`
  );
  return response.data;
};

export const revokeCertificate = async (data: AssuredTravelRevokeCertificateRequest): Promise<any> => {
  const response = await axios.get(
    `${process.env.assuredTravelUrl}?messagetype=${settings.messageTypes.revokeCertificate}&UserID=${
    process.env.assuredTravelUserId
    }&certificateNumber=${data.certificateNumber}&prospectID=${data.prospectId}&reason=${data.reason}&UserMessageReference=${
    data.userMessageReference
    }`
  );
  return response.data;
};
