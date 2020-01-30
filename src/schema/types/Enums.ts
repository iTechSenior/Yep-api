import { registerEnumType } from 'type-graphql';

export enum DeliveryMethod {
  Email = 'Email',
  Facebook = 'Facebook',
  FacebookMessenger = 'Facebook Messenger',
  Sms = 'SMS',
  WhatsApp = 'WhatsApp',
  GoogleVoice = 'Google Voice',
  Line = 'Line',
  WeChat = 'WeChat',
  KaKaoTalk = 'KaKaoTalk',
}
registerEnumType(DeliveryMethod, {
  name: 'DeliveryMethod',
  description: 'DeliveryMethod',
});

export enum CertificatePaymentEnum {
  Activation = 'Activation',
  Reservation = 'Reservation',
}
registerEnumType(CertificatePaymentEnum, {
  name: 'CertificatePaymentEnum',
  description: 'Activation or Reservation',
});

export enum MaritalStatusEnum {
  Married = 'Married',
  Single = 'Single',
}
registerEnumType(MaritalStatusEnum, {
  name: 'MaritalStatusEnum',
  description: 'Married or Single',
});

export enum PaymentAccountEnum {
  TripValetLLC = 'PAYMENT_API_KEY_TripValetLLC',
  GetMotivated = 'PAYMENT_API_KEY_GetMotivated',
  TripValetGeneral = 'PAYMENT_API_KEY_TripValetGeneral',
  CiceroTravel = 'PAYMENT_API_KEY_CiceroTravel',
  TripValetIncentives = 'PAYMENT_API_KEY_TripValetIncentives',
  YepWonder7Global = 'PAYMENT_API_KEY_YEP',
}
registerEnumType(PaymentAccountEnum, {
  name: 'PaymentAccountEnum',
  description: 'TripValet, CiceroTravel, .... TripValet Incentives',
});

export enum ContactStatus {
  Subscribe = 'Subscribe',
  Unsubscribe = 'Unsubscribe',
  Denied = 'Denied',
}
registerEnumType(ContactStatus, {
  name: 'ContactStatus',
  description: 'Subscribe, Unsubscribe, Denied',
});

export enum PhoneTypeEnum {
  Home = 'Home',
  Business = 'Business',
  Fax = 'Fax',
  Mobile = 'Mobile',
  Department = 'Department',
  Other = 'Other',
}
registerEnumType(PhoneTypeEnum, {
  name: 'PhoneTypeEnum',
  description: 'Type of Phone Number',
});

export enum VideoStatusEnum {
  Published = 'Published',
  Unpublished = 'Unpublished',
}
registerEnumType(VideoStatusEnum, {
  name: 'VideoStatusEnum',
  description: 'Published or Unpublished',
});

export enum ContentTypeEnum {
  Image = 'Image',
  Video = 'Video',
}
registerEnumType(ContentTypeEnum, {
  name: 'ContentTypeEnum',
  description: 'Image or Video',
});

export enum BrandTypeEnum {
  YEP = 'YEP',
  TripValet = 'TripValet',
}
registerEnumType(BrandTypeEnum, {
  name: 'BrandTypeEnum',
  description: 'YEP or TripValet',
});
