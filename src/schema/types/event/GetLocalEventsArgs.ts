import { Field, ArgsType, InputType, Int } from 'type-graphql';
import { Event } from './Event';

@ArgsType()
export class GetLocalEventsArgs {
  @Field({ nullable: true })
  city?: string;

  @Field({ nullable: true })
  zip?: string;

  // @Field({ nullable: true })
  // userId?: string;
}

@ArgsType()
export class GetLocalEventsForMobileArgs {
  @Field(() => Int, { nullable: true })
  month?: number;

  @Field(() => Int, { nullable: true })
  year?: number;

  @Field({ nullable: true })
  searchText: string;

  // @Field({ nullable: true })
  // userId?: string;
}
