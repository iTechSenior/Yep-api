import { ArgsType, Field, Float, InputType } from 'type-graphql';
import { CertificateTraveler } from './CertificateTraveler';
import { CreditCard } from '../user/CreditCard';
import { CreditCardInput } from '../user';
import { Address, AddressInput } from '../address';

@InputType()
export class OdenzaActivationPaymentInput {
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

  @Field(() => AddressInput)
  address: AddressInput;

  @Field(() => CreditCardInput)
  card: CreditCardInput;

  @Field()
  payActivation: boolean;

  @Field(() => Float)
  payAmount: number;

  @Field()
  cert: string;
}
