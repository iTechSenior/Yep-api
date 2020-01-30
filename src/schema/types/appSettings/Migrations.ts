import { DateTime } from 'luxon';
import { Field, ObjectType, ID, GraphQLISODateTime } from 'type-graphql';
import { Migration } from './Migration';

@ObjectType()
export class Migrations {
  @Field(() => [Migration])
  public data: Migration[];

  @Field(() => ID, { nullable: true })
  public id?: string;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate() })
  createdOn?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate() })
  updatedOn?: Date;

  [key: string]: any;
}
