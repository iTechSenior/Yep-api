import { Field, InputType, ArgsType } from 'type-graphql';
import { StripeDataInput } from './index';
import { AddressInput } from '../address';

@ArgsType()
export class UpdateAccountArgs {
  @Field({ nullable: true })
  id?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  password?: string;
}
