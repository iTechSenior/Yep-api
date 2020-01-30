import { ObjectType, Field, ID } from 'type-graphql';
import { Certificate } from '../certificate/Certificate';

@ObjectType()
export class ProspectBasics {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field()
  deliveryMethod: string;

  @Field()
  redeemed: boolean;

  @Field(() => Certificate)
  certificate: Certificate;

  @Field({ nullable: true })
  createdAt: Date;

  constructor(
    firstName: string,
    lastName: string,
    deliveryEndpoint: string,
    deliveryMethod: string,
    redeemed: boolean,
    certificate: Certificate,
    createdAt: Date
  ) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.deliveryEndpoint = deliveryEndpoint;
    this.deliveryMethod = deliveryMethod;
    this.redeemed = redeemed;
    this.certificate = certificate;
    this.createdAt = createdAt;
  }
}
