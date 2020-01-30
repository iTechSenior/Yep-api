import { ID, Int, Field, ObjectType } from 'type-graphql';

@ObjectType()
export class TripDate {
  @Field(() => ID)
  id: string;

  @Field(() => Int)
  days: number;

  @Field()
  end: Date;

  @Field()
  start: Date;

  @Field()
  status: 'Planning' | 'Active' | 'Completed' | 'No Availability';
}
