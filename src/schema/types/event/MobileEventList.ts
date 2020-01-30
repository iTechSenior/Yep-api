import { Field, ObjectType, Int } from 'type-graphql';
import { MobileEventsGroupByDay } from './MobileEventsGroupByDay';

@ObjectType()
export class MobileEventList {
  @Field(() => [MobileEventsGroupByDay])
  groupedEvents: MobileEventsGroupByDay[];

  @Field(() => Int)
  totalRows: number;
}
