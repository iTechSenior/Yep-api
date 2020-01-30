import { ObjectType, Field, Int } from 'type-graphql';
import { SfxCertificate } from './SfxCertificate';

@ObjectType()
export class SfxCertificateOrderResponse {
  @Field({ nullable: true })
  error?: string;

  @Field(() => Int)
  status: number;

  @Field(() => SfxCertificateOrderResponse)
  order: SfxCertificateOrderResponse;

  @Field(() => [SfxCertificate])
  certs: SfxCertificate[];
}
