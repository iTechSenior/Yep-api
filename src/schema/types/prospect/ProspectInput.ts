import { InputType, Field } from 'type-graphql';

@InputType()
export class ProspectInput {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field()
  uuid: string;

}
