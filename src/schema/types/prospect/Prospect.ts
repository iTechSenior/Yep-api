import { Field, ObjectType, GraphQLISODateTime, ID } from 'type-graphql';
import { DeliveryMethod } from '../Enums';
import { Visit } from './Visit';
import { AssuredTravelRequestCertificateResponse, Certificate } from '../certificate';
import { SfxCertificateOrderResponse } from '../certificate/SfxCertificateOrderResponse';
import { CertificateTraveler } from './CertificateTraveler';
import { CertificatePayment } from './CertificatePayment';
import { getNowUtc } from '@/helpers/utils';

@ObjectType()
export class Prospect {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  uuid: string;

  @Field(() => String, { nullable: true })
  userId?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field(() => String, { nullable: true })
  deliveryEndpoint?: string;

  @Field(() => String)
  deliveryMethod: 'Email' | 'Facebook' | 'Facebook Messenger' | 'SMS' | 'WhatsApp' | 'Google Voice' | 'Line' | 'WeChat' | 'KaKaoTalk';

  @Field({ nullable: true })
  phone?: string;

  @Field(() => [Visit])
  visits: Visit[];

  @Field(() => Certificate)
  certificate: Certificate;

  @Field()
  personalizedMessage: string;

  @Field()
  redeemed: boolean;

  @Field(() => AssuredTravelRequestCertificateResponse, { nullable: true })
  assuredTravel?: AssuredTravelRequestCertificateResponse;

  @Field(() => SfxCertificateOrderResponse, { nullable: true })
  sfx?: SfxCertificateOrderResponse;

  @Field(() => [CertificatePayment], { nullable: true })
  payments?: CertificatePayment[];

  @Field(() => [CertificateTraveler], { nullable: true })
  travelers?: CertificateTraveler[];

  @Field(() => [GraphQLISODateTime], { nullable: true })
  preferredDates?: Date[];

  @Field(() => [GraphQLISODateTime], { nullable: true })
  alternateDates?: Date[];

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  constructor(
    id?: string,
    uuid: string = '',
    userId: string = '',
    firstName: string = '',
    lastName: string = '',
    deliveryEndpoint: string = '',
    deliveryMethod?: 'Email' | 'Facebook' | 'Facebook Messenger' | 'SMS' | 'WhatsApp' | 'Google Voice' | 'Line' | 'WeChat' | 'KaKaoTalk',
    visits: Visit[] = [],
    certificate: Certificate = null,
    personalizedMessage: string = '',
    redeemed: boolean = false,
    payments: CertificatePayment[] = []
  ) {
    this.id = id;
    this.uuid = uuid;
    this.userId = userId;
    this.firstName = firstName;
    this.lastName = lastName;
    this.deliveryEndpoint = deliveryEndpoint;
    this.deliveryMethod = deliveryMethod;
    this.visits = visits;
    this.certificate = certificate;
    this.personalizedMessage = personalizedMessage;
    this.redeemed = redeemed;
    this.payments = payments;
    this.createdAt = getNowUtc();
    this.updatedAt = getNowUtc();
  }
}
