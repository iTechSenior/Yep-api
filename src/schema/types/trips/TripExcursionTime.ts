import { ObjectType, Field, ID, Float } from 'type-graphql';

@ObjectType()
export class TripExcursionTime {
  @Field(() => ID)
  id: string;

  @Field()
  start: Date;

  @Field()
  end: Date;

  @Field(() => Float)
  price: number;

  @Field(() => Float, { nullable: true })
  cost?: number;
}
