import { Field, InputType, GraphQLISODateTime } from 'type-graphql';
import { CreditCardInput } from '../user';
import { AddressInput } from '../address';
import { UserWithPasswordInput } from '../user/UserWithPasswordInput';

@InputType()
export class FunnelUserOrderInput {
  @Field(() => UserWithPasswordInput)
  public user: UserWithPasswordInput;

  @Field(() => AddressInput)
  public address: AddressInput;

  @Field()
  public product: string; // ProductId

  @Field(() => CreditCardInput)
  public card: CreditCardInput;

  @Field(() => [String], { nullable: true })
  public interests?: string[];

  @Field({ nullable: true })
  public certificate?: string;

  @Field({ nullable: true })
  public referralCode?: string;

  @Field({ nullable: true })
  public couponCode?: string;
}
