import { Field, InputType, Int } from 'type-graphql';

@InputType()
export class ClickFunnelsAffiliateUrlInput {
  @Field(() => Int)
  id: string;

  @Field()
  path: string;
}
