import uuid = require('uuid');
const fs = require('fs');
const saml = require('samlify');

const loginResponseTemplate = {
  context:
    '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{ID}" Version="2.0" IssueInstant="{IssueInstant}" Destination="{Destination}" InResponseTo="{InResponseTo}"><saml:Issuer>{Issuer}</saml:Issuer><samlp:Status><samlp:StatusCode Value="{StatusCode}"/></samlp:Status><saml:Assertion ID="{AssertionID}" Version="2.0" IssueInstant="{IssueInstant}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"><saml:Issuer>{Issuer}</saml:Issuer><saml:Subject><saml:NameID Format="{NameIDFormat}">{NameID}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="{SubjectConfirmationDataNotOnOrAfter}" Recipient="{SubjectRecipient}" InResponseTo="{InResponseTo}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="{ConditionsNotBefore}" NotOnOrAfter="{ConditionsNotOnOrAfter}"><saml:AudienceRestriction><saml:Audience>{Audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions>{AttributeStatement}</saml:Assertion></samlp:Response>',
  attributes: [
    {
      name: 'OrganizationID',
      valueTag: 'organizationId',
      nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
      valueXsiType: 'xs:string',
    },
    {
      name: 'FirstName',
      valueTag: 'firstName',
      nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
      valueXsiType: 'xs:string',
    },
    { name: 'LastName', valueTag: 'lastName', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic', valueXsiType: 'xs:string' },
    {
      name: 'EmailAddress',
      valueTag: 'emailAddress',
      nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic',
      valueXsiType: 'xs:string',
    },
    { name: 'ZIPCode', valueTag: 'zipCode', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic', valueXsiType: 'xs:string' },
  ],
};

const replaceTagsByValue = (rawXML: string, tagValues: any): string => {
  Object.keys(tagValues).forEach(t => {
    rawXML = rawXML.replace(new RegExp(`{${t}}`, 'g'), tagValues[t]);
  });
  return rawXML;
};

const createTemplateCallback = (_idp: any, _sp: any, user: any) => (template: any) => {
  const _id = 'bf5be4ce-b810-43b5-a597-01aa00bbc93f';
  const now = new Date();
  const spEntityID = _sp.entityMeta.getEntityID();
  const idpSetting = _idp.entitySetting;
  const fiveMinutesLater = new Date(now.getTime());
  fiveMinutesLater.setMinutes(fiveMinutesLater.getMinutes() + 5);
  const benefitHubUrl = process.env.NODE_ENV === 'development' ? process.env.BENEFITHUB_TEST_ENDPOINT : process.env.BENEFITHUB_PRODUCTION_ENDPOINT;

  const tvalue = {
    ID: _id,
    AssertionID: idpSetting.generateID ? idpSetting.generateID() : `${uuid.v4()}`,
    Destination: benefitHubUrl,
    Audience: spEntityID,
    SubjectRecipient: spEntityID,
    NameIDFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
    NameID: user.email,
    Issuer: idp.entityMeta.getEntityID(),
    IssueInstant: now.toISOString(),
    ConditionsNotBefore: now.toISOString(),
    ConditionsNotOnOrAfter: fiveMinutesLater.toISOString(),
    SubjectConfirmationDataNotOnOrAfter: fiveMinutesLater.toISOString(),
    AssertionConsumerServiceURL: benefitHubUrl,
    EntityID: spEntityID,
    InResponseTo: `${uuid.v4()}`,
    StatusCode: 'urn:oasis:names:tc:SAML:2.0:status:Success',
    attrOrganizationId: user.orgId,
    attrFirstName: user.firstName,
    attrLastName: user.lastName,
    attrEmailAddress: user.email,
    attrZipCode: user.zipCode,
  };

  return {
    id: _id,
    context: replaceTagsByValue(template, tvalue),
  };
};

let sp = null;
if (process.env.NODE_ENV === 'development') {
  sp = saml.ServiceProvider({
    metadata: fs.readFileSync('./env/BenefitHub_SP_SHA256_UAT.XML'),
  });
} else {
  sp = saml.ServiceProvider({
    metadata: fs.readFileSync('./BenefitHub_SP_SHA256_Prod.XML'),
  });
}

export const idp = saml.IdentityProvider({
  isAssertionEncrypted: true,
  metadata:
    process.env.NODE_ENV === 'development' ? fs.readFileSync('./env/TripValet_IdP_metadata_UAT.xml') : fs.readFileSync('./TripValet_IdP_metadata_PROD.xml'),
  // optional
  privateKey:
    process.env.NODE_ENV === 'development' ? fs.readFileSync('./env/TripValet_BenefitHub_UAT.key') : fs.readFileSync('./TripValet_BenefitHub_PROD.key'),
  encPrivateKey:
    process.env.NODE_ENV === 'development' ? fs.readFileSync('./env/TripValet_BenefitHub_UAT.key') : fs.readFileSync('./TripValet_BenefitHub_PROD.key'),
  dataEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#aes128-cbc',
  keyEncryptionAlgorithm: 'http://www.w3.org/2001/04/xmlenc#rsa-1_5',
  loginResponseTemplate,
});

saml.setSchemaValidator({
  validate: (_: any) => Promise.resolve(_),
});

module.exports = {
  sp,
  idp,
  createTemplateCallback,
};
