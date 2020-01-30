import { Field, InputType, ObjectType } from 'type-graphql';

@InputType()
export class UserCryptoInput {

  @Field()
  coin: 'Bitcoin' | 'Ethereum';

  @Field()
  coinConversion: number;

  @Field({ nullable: true })
  transactionId: string;

  @Field({ nullable: true })
  wallet: string;


}
