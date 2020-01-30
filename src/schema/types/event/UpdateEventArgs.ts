import { Field, ArgsType, InputType } from 'type-graphql';
import { AddressInput } from '../address';

@ArgsType()
export class UpdateEventArgs {
  @Field()
  eventId: string;

  @Field()
  when: Date;

  @Field()
  timeZone: string;

  @Field()
  type: 'Location' | 'Webinar';

  @Field({ nullable: true })
  webinarUrl?: string;

  @Field(() => AddressInput, { nullable: true })
  address?: AddressInput;

  @Field({ nullable: true })
  where?: string;

  @Field()
  description: string;

  @Field(() => [String], { nullable: true })
  recurringDaysOfWeek?: string[];
}
