import { Field, InputType, ArgsType, ID } from 'type-graphql';

@ArgsType()
export class AddProspectArgs {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field(() => String, { nullable: true, defaultValue: 'Email' })
  deliveryMethod?: 'Email' | 'Facebook' | 'Facebook Messenger' | 'SMS' | 'WhatsApp' | 'Google Voice' | 'Line' | 'WeChat' | 'KaKaoTalk';

  @Field({ nullable: true })
  certificateId: string;

  @Field({ nullable: true })
  personalizedMessage: string;

  @Field({ nullable: true })
  phone?: string;
}
