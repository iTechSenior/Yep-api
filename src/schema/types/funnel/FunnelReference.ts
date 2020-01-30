import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class FunnelReference {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;

  constructor(id: string, title: string) {
    this.id = id;
    this.title = title;
  }
}
