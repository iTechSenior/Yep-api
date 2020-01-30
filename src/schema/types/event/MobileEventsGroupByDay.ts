import { Field, ObjectType, Int } from 'type-graphql';
import { MobileEvent } from './MobileEvent';

@ObjectType()
export class MobileEventsGroupByDay {
  @Field()
  day: string;

  @Field(() => [MobileEvent])
  events: MobileEvent[];
}
