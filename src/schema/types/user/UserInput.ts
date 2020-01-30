import { DateTime } from 'luxon';
import { Field, InputType, ID, GraphQLISODateTime } from 'type-graphql';
@InputType()
export class UserInput {
  @Field()
  public uuid: string;

  @Field()
  public firstName: string;

  @Field()
  public lastName: string;

  @Field()
  public email: string;

  @Field()
  public password: string;

  @Field()
  public active: boolean;

  @Field(() => [String], { nullable: true })
  public roles?: string[];

  @Field(() => ID, { nullable: true })
  public readonly id?: string;

  @Field({ nullable: true })
  public middleName?: string;

  @Field({ nullable: true })
  public avatarUrl?: string;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate() })
  createdOn?: Date;

  @Field(() => GraphQLISODateTime, { defaultValue: DateTime.utc().toJSDate() })
  updatedOn?: Date;
}
