import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Category {
  @Field()
  category: string;
}
