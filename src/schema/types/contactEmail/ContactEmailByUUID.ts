import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class ContactEmailByUUID {
  @Field()
  email: string;
}
