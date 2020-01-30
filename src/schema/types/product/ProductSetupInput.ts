import { Field, InputType, Float } from 'type-graphql';
@InputType()
export class ProductSetupInput {
  @Field(() => Float)
  fee: number;

  @Field()
  description: string;
}
