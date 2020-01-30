import { Field, InputType, Int } from 'type-graphql';
@InputType()
export class SponsorInput {
  @Field(() => Int)
  id: string;

  @Field()
  email: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;
}
