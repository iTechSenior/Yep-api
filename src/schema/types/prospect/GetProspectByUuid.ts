import { Field, ArgsType } from 'type-graphql';

@ArgsType()
export class GetProspectByUuid {
  @Field(() => String)
  uuid: string;
}
