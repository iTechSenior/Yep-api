import { Field, ObjectType, ID, Int } from 'type-graphql';
import { ImageContent } from './ImageContent';
import { Document } from '../document';
import { AssuredTravelProduct } from './AssuredTravelProduct';
import { SfxOffer } from './SfxOffer';
import { UnlimitedCertificatesProduct } from './UnlimtedCertificatesProduct';
import { CertificatePdfContent } from './CertificatePdfContent';
import { CertificateInput } from './CertificateInput';

@ObjectType()
export class Certificate {
  static fromCertificate(data: CertificateInput) {
    return new this(
      data.id,
      data.title,
      data.description,
      data.imageUrl,
      data.membershipLevel,
      data.apiAccessToken,
      data.active,
      data.defaultMessage,
      data.displayOrder,
      data.images
    );
  }
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  imageUrl: string;

  @Field({ nullable: true })
  redemptionUrl?: string;

  @Field({ nullable: true })
  sgTemplateId1?: string;

  @Field({ nullable: true })
  sgTemplateId2?: string;

  @Field(() => [String], { nullable: true })
  //membershipLevel: ('TVI PLUS' | 'TVI PRO' | 'TVI BASIC')[];
  membershipLevel?: string[];

  @Field()
  apiAccessToken: string;

  @Field()
  active: boolean;

  @Field(() => Int, { nullable: true })
  destinations?: number;

  @Field()
  defaultMessage: string;

  @Field(() => Int)
  displayOrder: number;

  @Field(() => [ImageContent])
  images: ImageContent[];

  @Field(() => [Document])
  documents: Document[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field()
  vendor: string;

  @Field(() => AssuredTravelProduct, { nullable: true })
  assuredTravel?: AssuredTravelProduct;

  @Field(() => SfxOffer, { nullable: true })
  sfx?: SfxOffer;

  @Field(() => UnlimitedCertificatesProduct, { nullable: true })
  unlimitedCertificates?: UnlimitedCertificatesProduct;

  @Field(() => CertificatePdfContent, { nullable: true })
  pdfContent?: CertificatePdfContent;

  constructor(
    id?: string,
    title: string = '',
    description: string = '',
    imageUrl: string = '',
    //membershipLevel: ('TVI BASIC' | 'TVI PLUS' | 'TVI PRO')[] = ['TVI PLUS'],
    membershipLevel?: string[],
    apiAccessToken: string = '',
    active: boolean = true,
    defaultMessage: string = '',
    displayOrder: number = 0,
    images: ImageContent[] = [],
    documents: Document[] = [],
    vendor: string = 'CMI'
  ) {
    this.id = id;
    this.title = title;
    this.description = description;
    this.imageUrl = imageUrl;
    this.membershipLevel = membershipLevel;
    this.apiAccessToken = apiAccessToken;
    this.active = active;
    this.defaultMessage = defaultMessage;
    this.displayOrder = displayOrder;
    this.images = images;
    this.documents = documents;
    this.vendor = vendor;
  }
}
