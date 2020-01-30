import { ObjectType, Field } from 'type-graphql';
@ObjectType()
export class JwtUser {
  @Field()
  id: string;

  @Field()
  userName: string;

  @Field(() => [String])
  roles: string[];
}
