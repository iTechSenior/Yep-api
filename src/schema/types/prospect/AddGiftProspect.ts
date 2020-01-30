import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class AddGiftProspect {
  @Field()
  referralCode: string;

  @Field()
  certificateCode: string;
}
