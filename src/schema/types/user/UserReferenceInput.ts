import { ObjectType, Field, ID, InputType } from 'type-graphql';
import { FilterRootFields } from 'graphql-tools';

@InputType()
export class UserReferenceInput {
  @Field(() => ID)
  id: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;
}
