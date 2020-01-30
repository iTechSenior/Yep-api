import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class StripeProductReference {
  @Field()
  id: string;

  @Field()
  name: string;

  constructor(id: string, name: string) {
    this.id = id;
    this.name = name;
  }
}
