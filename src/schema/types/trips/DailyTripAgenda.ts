import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class DailyTripAgenda {
  @Field(() => Int)
  day: number;

  @Field()
  dayTitle: string;

  @Field()
  imageUrl: string;

  @Field(() => [String])
  agenda: string[];
}
