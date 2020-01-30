import { Field, ID, ObjectType } from 'type-graphql';

@ObjectType()
export class ClickFunnelsAffiliateUrl {
  @Field(() => ID)
  id: string;

  @Field()
  path: string;
}
