import { ObjectType, Field, ID, Float } from 'type-graphql';

@ObjectType()
export class TripRoomPrice {
  @Field(() => ID)
  id: string;

  @Field()
  role: string;

  @Field(() => Float)
  pricePerRoom: number;

  @Field(() => Float)
  pricePerRoomPerPerson: number;

  @Field(() => Float)
  downPayment: number;

  @Field(() => Float)
  downPaymentPerPerson: number;

  @Field(() => Float)
  addOnPricePerNight: number;

  @Field(() => Float)
  extraPricePerNightPerPerson: number;
}
