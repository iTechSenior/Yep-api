import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class UserWithPassword {
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
}
