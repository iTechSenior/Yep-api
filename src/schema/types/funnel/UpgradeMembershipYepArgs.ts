import { Field, ArgsType } from 'type-graphql';
import { FunnelUserOrderInput } from './FunnelUserOrderInput';
import { FunnelStepProduct } from './FunnelStepProduct';
import { AddressInput } from '../address';
import { CreditCardInput } from '../user';

@ArgsType()
export class UpgradeMembershipYepArgs {
  @Field(() => AddressInput)
  public address: AddressInput;

  @Field()
  public product: string; // ProductId

  @Field(() => CreditCardInput)
  public card: CreditCardInput;

  @Field(() => String)
  public currentProduct: string;

  @Field()
  public userId: string;

  @Field()
  public requestType: 'Initial' | 'SCA_SUCCESS' | 'SCA_FAIL';

  @Field({ nullable: true })
  public paymentIntentId?: string;
}
