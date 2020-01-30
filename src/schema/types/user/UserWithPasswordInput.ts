import { Field, InputType, GraphQLISODateTime } from 'type-graphql';
@InputType()
export class UserWithPasswordInput {
  @Field()
  public firstName: string;
  @Field()
  public lastName: string;
  @Field()
  public email: string;
  @Field()
  public password: string;
  @Field()
  public confirmPassword: string;
  @Field()
  public phone: string;
  @Field(() => GraphQLISODateTime)
  public birthDay: Date;
}
