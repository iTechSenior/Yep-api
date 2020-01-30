import { Field, ObjectType } from 'type-graphql';
import { TripImage } from '.';

@ObjectType()
export class TripLocation {
  @Field()
  cityOrRegion: string;

  @Field()
  country: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => [TripImage], { nullable: true })
  images?: TripImage[];
}
