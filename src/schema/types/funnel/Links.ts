import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Links {
  @Field()
  title: string;

  @Field()
  url: string;
}
