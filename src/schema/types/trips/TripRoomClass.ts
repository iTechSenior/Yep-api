import { Field, ID, Int, ObjectType } from 'type-graphql';
import { TripRoomPrice, TripImage } from './index';

@ObjectType()
export class TripRoomClass {
  @Field(() => ID)
  id: string;

  @Field()
  description: string;

  @Field(() => Int)
  rooms: number;

  @Field(() => Int)
  roomsRemaining: number;

  @Field(() => [TripImage])
  images: TripImage[];

  @Field()
  roomPriceBasis: string;

  @Field(() => [TripRoomPrice])
  pricing: TripRoomPrice[];
}
