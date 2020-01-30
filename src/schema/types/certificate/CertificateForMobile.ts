import { Field, ObjectType, ID, Int } from 'type-graphql';
import { ImageContent } from './ImageContent';
import { Document } from '../document';
import { AssuredTravelProduct } from './AssuredTravelProduct';
import { SfxOffer } from './SfxOffer';
import { UnlimitedCertificatesProduct } from './UnlimtedCertificatesProduct';
import { CertificatePdfContent } from './CertificatePdfContent';
import { CertificateInput } from './CertificateInput';
import { Certificate } from './Certificate';
import { find } from 'lodash';
import { stripHtmlTags } from '@/helpers/utils';

@ObjectType()
export class CertificateForMobile {
  static fromCertificate(data: Certificate) {
    return new this(data.id, data.title, data.membershipLevel, stripHtmlTags(data.defaultMessage), find(data.images, image => image.type === 'Thumbnail').url);
  }

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field(() => [String], { nullable: true })
  membershipLevels: string[];

  @Field()
  defaultMessage: string;

  @Field()
  thumbnail: string;

  constructor(id: string, title: string, membershipLevels: string[], defaultMessage: string, thumbnail: string) {
    this.id = id;
    this.title = title;
    this.membershipLevels = membershipLevels;
    this.defaultMessage = defaultMessage;
    this.thumbnail = thumbnail;
  }
}
