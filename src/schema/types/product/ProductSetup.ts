import { Field, ObjectType, Float } from 'type-graphql';
@ObjectType()
export class ProductSetup {
  @Field(() => Float)
  fee: number;

  @Field()
  description: string;
}
