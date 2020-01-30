import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType()
export class UnlimitedCertificatesProduct {
  @Field()
  url: string;

  @Field(() => Int, { nullable: true })
  maxDaysToRegister?: number;
}
