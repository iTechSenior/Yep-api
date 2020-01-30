import { ObjectType, Field } from 'type-graphql';
import { CreditCard } from '../user';
import { Address } from '../address';
import { UserWithPassword } from '../user/UserWithPassword';

@ObjectType()
export class FunnelUserOrder {
  @Field(() => UserWithPassword)
  public user: UserWithPassword;

  @Field()
  public address: Address;

  @Field()
  public product: string; // ProductId

  @Field()
  public card: CreditCard;

  @Field(() => [String])
  public interests?: string[];

  @Field()
  public certificate?: string;

  @Field()
  public referralCode?: string;

  @Field()
  public couponCode?: string;
}
