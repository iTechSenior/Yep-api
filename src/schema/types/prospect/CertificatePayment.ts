import { ObjectType, Field, Float } from 'type-graphql';
import { CertificatePaymentEnum } from '../Enums';
import { AuthorizeNetTransaction } from './AuthorizeNetTransaction';

@ObjectType()
export class CertificatePayment {
  @Field(() => CertificatePaymentEnum)
  type: CertificatePaymentEnum;

  @Field(()=>Float)
  amount: number;

  @Field()
  transId: string;

  @Field()
  authCode: string;

  @Field()
  invoiceNumber: string;

  @Field(() => AuthorizeNetTransaction)
  authorizeNet: AuthorizeNetTransaction;

  @Field({ nullable: true })
  createdAt?: Date;
}
