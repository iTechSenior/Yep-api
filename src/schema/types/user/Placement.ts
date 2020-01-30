import { Field, InputType, ArgsType, ObjectType } from 'type-graphql';

@ObjectType()
export class PlacementResponse {
  @Field({ defaultValue: 'Right' })
  placement: string;
}
