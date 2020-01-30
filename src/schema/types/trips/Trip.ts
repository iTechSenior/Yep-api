import { Field, ID, ObjectType } from 'type-graphql';
import { DailyTripAgenda, CouponCode, TripDate, TripLocation, TripImage, TripExcursion, TripHotel } from './index';

@ObjectType()
export class Trip {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => [DailyTripAgenda])
  agenda: DailyTripAgenda[];

  @Field(() => [CouponCode], { nullable: true })
  couponCodes?: CouponCode[];

  @Field({ nullable: true })
  createdAt?: Date;

  @Field(() => [TripDate])
  dates: TripDate[];

  @Field({ nullable: true })
  description?: string;

  @Field(() => [TripExcursion], { nullable: true })
  excursions?: TripExcursion[];

  @Field(() => TripHotel)
  hotel: TripHotel;

  @Field(() => TripLocation)
  location: TripLocation;

  @Field(() => [String])
  includes: string[];

  @Field(() => [TripImage])
  images: TripImage[];

  @Field()
  title: string;

  @Field({ nullable: true })
  updatedAt?: Date;

  @Field(() => [String], { nullable: true })
  urlSlug?: string[];

  @Field({ nullable: true })
  videoUrl?: string;

  constructor(
    agenda: DailyTripAgenda[] = [],
    dates: TripDate[] = [],
    location: TripLocation = null,
    hotel: TripHotel = null,
    includes: string[] = [],
    images: TripImage[] = [],
    title: string = ''
  ) {
    this.agenda = agenda;
    this.dates = dates;
    this.location = location;
    this.hotel = hotel;
    this.includes = includes;
    this.images = images;
    this.title = title;
  }
}
