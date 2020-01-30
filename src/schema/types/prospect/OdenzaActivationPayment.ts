import { ArgsType, Field, Float } from 'type-graphql';
import { CertificateTraveler } from './CertificateTraveler';
import { CreditCard } from '../user/CreditCard';
import { Address } from '../address';

@ArgsType()
export class OdenzaActivationPayment {
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

  @Field(() => Address)
  address: Address;

  @Field(() => CreditCard)
  card: CreditCard;

  @Field()
  payActivation: boolean;

  @Field(() => Float)
  payAmount: number;

  @Field()
  cert: string;
}
