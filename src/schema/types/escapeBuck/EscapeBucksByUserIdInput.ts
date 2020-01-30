import { Field, InputType, ID, GraphQLISODateTime } from 'type-graphql';
@InputType()
export class EscapeBucksByUserIdInput {
  @Field()
  userId: string;

  @Field()
  bucks: number;
}
