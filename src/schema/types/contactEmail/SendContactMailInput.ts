import { InputType, Field } from 'type-graphql';

@InputType()
export class SendContactMailInput {
  @Field()
  uuid: string;

  @Field()
  accept: boolean;
}
