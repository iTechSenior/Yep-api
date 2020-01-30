import { Field, ObjectType, Int } from 'type-graphql';
import { ProductSetup } from './ProductSetup';

@ObjectType()
export class ProductReference {
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

  @Field(() => ProductSetup)
  setup: ProductSetup;

  constructor(id: string, name: string, displayName: string, amount: number, interval: string, setup: ProductSetup) {
    this.id = id;
    this.name = name;
    this.displayName = displayName;
    this.amount = amount;
    this.interval = interval;
    this.setup = setup;
  }
}
