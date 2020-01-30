import { InputType, Field, ArgsType } from 'type-graphql';

@ArgsType()
export class GetContactEmailArgs {
  @Field()
  uuid: string;
}
