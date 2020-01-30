import { ObjectType, Field, ID } from 'type-graphql';
import GraphQLJSON from 'graphql-type-json';

@ObjectType()
export class ClickFunnelsWebHook {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => GraphQLJSON)
  payload: any;

  constructor(id?: string, payload: any = {}) {
    this.id = id;
    this.payload = payload;
  }
}
