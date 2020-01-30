import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class CertificateReference {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field({ nullable: true })
  imageUrl?: string;
}
