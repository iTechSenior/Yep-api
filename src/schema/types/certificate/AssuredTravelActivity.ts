import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class AssuredTravelActivity {
  @Field()
  activityType: 1 | 2 | 3 | 4 | 5; // - 1=Issued 2=Registered 3=Redeemed 4=Voided 5=Declined

  @Field()
  fromDate: string; //'MM/DD/YYYY'

  @Field()
  endDate: string; //'MM/DD/YYYY'

  @Field({ nullable: true })
  userMessageReference?: string;
}
