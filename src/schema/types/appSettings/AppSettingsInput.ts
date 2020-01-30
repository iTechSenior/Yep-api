import { Field, InputType, ID } from 'type-graphql';

@InputType()
export class AppSettingsInput {
  @Field(() => ID)
  public id: string;

  @Field(() => [String])
  public categories: string[];
}
