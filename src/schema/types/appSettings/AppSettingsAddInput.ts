import { Field, ArgsType, InputType } from 'type-graphql';

@InputType()
export class AppSettingsAddInput {
  @Field(() => [String])
  categories: string[];
}
