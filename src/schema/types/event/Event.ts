import { ObjectType, Field, ID, GraphQLISODateTime } from 'type-graphql';
import { DateTime } from 'luxon';
import { Address } from '../address';
import { Coordinate } from './Coordinate';
import { IDocumentSession } from 'ravendb';
import { SaveEventArgs } from './SaveEventArgs';
import { JwtUser } from '../JwtUser';
import zipcodes from 'zipcodes';

@ObjectType()
export class Event {
  static async fromSaveEventArgs(session: IDocumentSession, data: SaveEventArgs, user: JwtUser) {
    let event: Event;
    const { id, ...rest } = data;

    if (data.id) {
      event = await session.load<Event>(data.id);
    } else {
      event = new this(
        user.id,
        data.description,
        data.when,
        data.timeZone,
        data.type,
        data.webinarUrl,
        data.address,
        data.where,
        null,
        data.recurringDaysOfWeek,
        data.publish
      );
      event.createdAt = DateTime.utc().toJSDate();
      await session.store(event);
    }

    Object.assign(event, { ...rest, updatedOn: DateTime.utc().toJSDate() });

    if (data.type === 'Location') {
      const location = zipcodes.lookup(data.address.zip);
      if (!location) {
        throw new Error('Zip Code Invalid!');
      }
      event.coordinate = { lat: location.latitude, lng: location.longitude };
    }
    await session.saveChanges();
    return event;
  }

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  userId: string;

  @Field(() => Date, { nullable: true })
  when: Date;

  @Field()
  timeZone: string;

  @Field()
  type: 'Location' | 'Webinar';

  @Field({ nullable: true })
  webinarUrl?: string;

  @Field({ nullable: true })
  where?: string;

  @Field(() => Address, { nullable: true })
  address?: Address;

  @Field(() => Coordinate, { nullable: true })
  coordinate?: Coordinate;

  @Field()
  description: string;

  @Field({ nullable: true })
  publish?: boolean;

  @Field(() => [String], { nullable: true })
  recurringDaysOfWeek?: string[];

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  updatedAt?: Date;

  constructor(
    userId: string,
    description: string,
    when: Date,
    timeZone: string,
    type: 'Location' | 'Webinar',
    webinarUrl?: string,
    address?: Address,
    where?: string,
    coordinate?: Coordinate,
    recurringDaysOfWeek?: string[],
    publish: boolean = false
  ) {
    this.userId = userId;
    this.when = when;
    this.timeZone = timeZone;
    this.type = type;
    this.webinarUrl = webinarUrl;
    this.address = address;
    this.coordinate = coordinate;
    this.description = description;
    this.where = where;
    this.publish = publish;
    this.recurringDaysOfWeek = recurringDaysOfWeek;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }
}
