import { ArgsType, Field } from 'type-graphql';
import { Trip } from './index';

@ArgsType()
export class AddTripArgs {
  @Field(() => Trip)
  trip: Trip;
}
