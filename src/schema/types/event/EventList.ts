import { Field, ObjectType, Int } from 'type-graphql';
import { Event } from './Event';

@ObjectType()
export class EventList {
  @Field(() => [Event])
  events: Event[];

  @Field(() => Int)
  totalRow: number;
}
