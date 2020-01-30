import { ObjectType, Field, ID } from 'type-graphql';
import { Certificate } from '../certificate/Certificate';

@ObjectType()
export class ProspectReference {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field()
  deliveryMethod: string;

  constructor(id: string, firstName: string, lastName: string, deliveryEndpoint: string, deliveryMethod: string) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.deliveryEndpoint = deliveryEndpoint;
    this.deliveryMethod = deliveryMethod;
  }
}
