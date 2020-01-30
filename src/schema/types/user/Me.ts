import { Field, ObjectType, ID } from 'type-graphql';
//  import { Phone } from '../client/Phone';

@ObjectType()
export class Me {
  @Field(() => ID)
  public id: string;

  @Field()
  public firstName: string;

  @Field()
  public lastName: string;

  @Field()
  public email: string;

  // @Field(() => [Phone])
  // public phone: Phone[];

  // @Field(() => [UserRoleReference])
  // public roles: UserRoleReference[];
}
