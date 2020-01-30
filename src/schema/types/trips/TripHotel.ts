import { Field, Int, ObjectType } from 'type-graphql';
import { TripImage, TripRoomClass } from '.';

@ObjectType()
export class TripHotel {
  @Field()
  description: string;

  @Field(() => [TripImage])
  images: TripImage[];

  @Field(() => [TripRoomClass])
  rooms: TripRoomClass[];

  @Field()
  property: string;

  @Field(() => Int)
  totalRooms: number;

  @Field(() => Int)
  totalRoomsRemaining: number;
}
