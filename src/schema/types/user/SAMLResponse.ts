import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class SAMLResponse {
  @Field()
  samlResponse: string;
}
