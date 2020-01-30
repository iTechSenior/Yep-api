import { InputType, Field } from 'type-graphql';

@InputType()
export class ProspectCustomer {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;
}
