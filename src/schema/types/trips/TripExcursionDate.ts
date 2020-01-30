import { Field, ID, ObjectType } from 'type-graphql';
import { TripExcursionTime } from './TripExcursionTime';

@ObjectType()
export class TripExcursionDate {
  @Field(() => ID)
  id: string;

  @Field()
  tripDateId: string;

  @Field()
  day: Date;

  @Field(() => [TripExcursionTime])
  times: TripExcursionTime[];
}
