import { Field, InputType } from 'type-graphql';

@InputType()
export class UpdatePasswordInput {
  @Field()
  currentPassword: string;

  @Field()
  newPassword: string;

}
