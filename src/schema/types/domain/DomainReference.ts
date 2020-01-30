import { Field, ObjectType, ID } from 'type-graphql';
@ObjectType()
export class DomainReference {
  @Field(() => ID, { nullable: true })
  id: string;

  @Field()
  tld: string;

  constructor(id: string, tld: string) {
    this.id = id;
    this.tld = tld;
  }
}
