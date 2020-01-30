import { InputType, ArgsType, Field } from 'type-graphql';

@ArgsType()
export class GetCiceroUrlInput {
  @Field()
  path: string;
}
