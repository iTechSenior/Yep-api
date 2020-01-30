import { ArgsType, Field, ObjectType } from 'type-graphql';
import { CertificateTraveler } from './CertificateTraveler';
import { Address } from '../address';
import { CreditCard } from '../user/CreditCard';

@ArgsType()
export class LasVegasCertificatePayment {
  @Field()
  uuid: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field({ nullable: true })
  deliveryEndpoint?: string;

  @Field()
  phone: string;

  @Field(() => [CertificateTraveler], { nullable: true })
  travelers?: CertificateTraveler[];

  @Field(() => [Date])
  preferredDates: Date[];

  @Field(() => [Date])
  alternateDates: Date[];

  @Field(() => Address)
  address: Address;

  @Field(() => CreditCard)
  card: CreditCard;

  @Field()
  payActivation: boolean;

  @Field()
  payReservation: boolean;
}
