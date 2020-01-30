import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ClickFunnels {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field()
  url: string;

  @Field()
  active: boolean;

  constructor(id?: string, title: string = ' ', url: string = '', active: boolean = true) {
    this.id = id;
    this.title = title;
    this.url = url;
    this.active = active;
  }
}
