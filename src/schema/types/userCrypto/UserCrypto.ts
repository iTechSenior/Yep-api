import { Field, ObjectType, Int } from 'type-graphql';
@ObjectType()
export class UserCrypto {
  @Field()
  coin: 'Bitcoin' | 'Ethereum';

  @Field(() => Int)
  coinConversion: number;

  @Field({ nullable: true })
  transactionId: string;

  @Field({ nullable: true })
  wallet: string;
}
