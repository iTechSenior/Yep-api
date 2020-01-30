import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class SubCategory {
  @Field()
  subCategory: string;
}
