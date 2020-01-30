import { ObjectType, Field, ID } from 'type-graphql';
import { TripExcursionDate } from './TripExcursionDate';

@ObjectType()
export class TripExcursion {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field()
  imageUrl: string;

  @Field({ nullable: true })
  included?: string;

  @Field({ nullable: true })
  price?: string;

  @Field({ nullable: true })
  restrictions?: string;

  @Field()
  times: string;

  @Field()
  what: string;

  @Field()
  whatType: string = 'TOUR';

  @Field()
  when: string;

  @Field(() => [TripExcursionDate])
  dates: TripExcursionDate[];
}
