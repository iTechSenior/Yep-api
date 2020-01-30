import { ArgsType, Field, ObjectType, InputType } from 'type-graphql';
import { CertificateTraveler } from './CertificateTraveler';
import { CreditCardInput } from '../user';
import { Address, AddressInput } from '../address';
import { CreditCard } from '../user/CreditCard';
import { CertificateTravelerInput } from './CertificateTravelerInput';

@InputType()
export class LasVegasCertificatePaymentInput {
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

  @Field(() => [CertificateTravelerInput], { nullable: true })
  travelers?: CertificateTravelerInput[];

  @Field(() => [Date])
  preferredDates: Date[];

  @Field(() => [Date])
  alternateDates: Date[];

  @Field(() => AddressInput)
  address: AddressInput;

  @Field(() => CreditCardInput)
  card: CreditCardInput;

  @Field()
  payActivation: boolean;

  @Field()
  payReservation: boolean;
}
