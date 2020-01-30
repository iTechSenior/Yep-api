import { Field, InputType, ID } from 'type-graphql';

@InputType()
export class FunnelReferenceInput {
  @Field(() => ID)
  id: string;

  @Field()
  title: string;
}
