import { Field, ObjectType, ID, GraphQLISODateTime } from 'type-graphql';
@ObjectType()
export class EscapeBucksByUserId {
  @Field()
  userId: string;

  @Field()
  bucks: number;
}
