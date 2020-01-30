import { ObjectType, Field, ID } from 'type-graphql';
import { YepProspectReceiver } from './YepProspectReceiver';

@ObjectType()
export class YepProspect {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field({ nullable: true })
  categoryId: string;

  @Field({ nullable: true })
  personalizedMessage: string;

  constructor(firstName: string, lastName: string, deliveryEndpoint: string, categoryId: string, personalizedMessage: string) {
    this.firstName = firstName;
    this.lastName = lastName;
    this.deliveryEndpoint = deliveryEndpoint;
    this.categoryId = categoryId;
    this.personalizedMessage = personalizedMessage;
  }
}
