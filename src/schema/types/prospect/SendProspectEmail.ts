import { ObjectType, Field, ArgsType, InputType } from 'type-graphql';
@InputType()
export class SendProspectEmail {
  @Field()
  receiverEmail: string;

  @Field()
  receiverFirstName: string;

  @Field()
  replyEmail: string;

  @Field()
  senderFirstName: string;

  @Field()
  senderLastName: string;

  @Field()
  message: string;
}
