import { ObjectType, Field, ID, GraphQLISODateTime } from 'type-graphql';
import { DateTime } from 'luxon';
import { Address } from '../address';
import { Coordinate } from './Coordinate';
import { IDocumentSession } from 'ravendb';
import { JwtUser } from '../JwtUser';
import { UserReference } from '../user';
import shortid from 'shortid';
import { Event } from '.';
import { getShortUuid } from '@/helpers/utils';

@ObjectType()
export class MobileEvent {
  static async fromEvent(session: IDocumentSession, data: Event, user: JwtUser) {
    let event: MobileEvent;
    const { id, ...rest } = data;
    event = new this(
      getShortUuid(),
      data.id!,
      await UserReference.fromJwtUser(session, data.userId),
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
    Object.assign(event, { ...rest, updatedOn: DateTime.utc().toJSDate() });
    return event;
  }

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => ID, { nullable: true })
  eventId?: string;

  @Field(() => UserReference)
  who: UserReference;

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
    uuid: string,
    eventId: string,
    who: UserReference,
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
    this.id = uuid;
    this.eventId = eventId;
    this.who = who;
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
