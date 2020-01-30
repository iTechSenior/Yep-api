import { Field, InputType, Int } from 'type-graphql';
import { ProductSetupInput } from './ProductSetupInput';

@InputType()
export class ProductReferenceInput {
  @Field()
  id: string;

  @Field()
  name: string;

  @Field()
  displayName: string;

  @Field(() => Int)
  amount: number;

  @Field()
  interval: string;

  @Field(() => ProductSetupInput)
  setup: ProductSetupInput;
}
