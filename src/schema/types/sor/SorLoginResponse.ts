import { ObjectType, Field } from 'type-graphql';
import { APIMessageResponse } from '../common';

@ObjectType()
export class SorLoginResponse extends APIMessageResponse {
  @Field({ nullable: true })
  url?: string;
}
