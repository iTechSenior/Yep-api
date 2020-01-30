import { Field, InputType } from 'type-graphql';
@InputType()
export class DomainReferenceInput {
  @Field()
  id: string;

  @Field()
  tld: string;
}
