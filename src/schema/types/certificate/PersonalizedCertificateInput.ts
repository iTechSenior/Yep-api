import { Field, InputType } from 'type-graphql';

@InputType()
export class PersonalizedCertificateInput {
  @Field()
  id: string;
}
