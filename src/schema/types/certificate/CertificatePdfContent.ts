import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class CertificatePdfContent {
  @Field()
  title: string;

  @Field()
  description: string;

  @Field()
  base64: string;
}
