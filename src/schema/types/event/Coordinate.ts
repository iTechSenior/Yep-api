import { Field, ObjectType, Float } from 'type-graphql';

@ObjectType()
export class Coordinate {
  @Field()
  lat: number;

  @Field()
  lng: number;
}
