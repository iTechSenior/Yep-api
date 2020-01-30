import 'reflect-metadata';
import { Field, ObjectType } from 'type-graphql';
@ObjectType()
export class Migration {
  @Field()
  executedOn: Date;

  @Field()
  migration: string;
}
