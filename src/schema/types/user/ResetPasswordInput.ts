import { Field, InputType, ArgsType } from 'type-graphql';

@ArgsType()
export class ResetPasswordArgs {
  @Field()
  resetToken: string;

  @Field()
  newPassword: string;
}
