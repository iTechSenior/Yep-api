import { BooleanResponse } from './BooleanResponse';
import { ObjectType, Field } from 'type-graphql';
import { FilterRootFields } from 'graphql-tools';

@ObjectType()
export class APIMessageResponse extends BooleanResponse {
  @Field({ nullable: true })
  message?: string;
}
