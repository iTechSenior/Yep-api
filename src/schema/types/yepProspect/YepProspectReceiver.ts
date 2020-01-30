import { InputType, Field } from 'type-graphql';

@InputType()
export class YepProspectReceiver {
  @Field({ nullable: true })
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;
}
