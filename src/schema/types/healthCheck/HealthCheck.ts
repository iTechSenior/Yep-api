import { Field, ObjectType, GraphQLISODateTime } from 'type-graphql';
import { DateTime } from 'luxon';

@ObjectType()
export class HealthCheck {
  @Field({ nullable: true })
  id?: string;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate(), nullable: true })
  createdAt?: Date;

  payload: any;

  constructor(id?: string, createdAt?: Date, payload: any = {}) {
    this.id = id;
    this.createdAt = createdAt;
    this.payload = payload;
  }
}
