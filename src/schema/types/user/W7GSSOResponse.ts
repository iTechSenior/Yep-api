import { Field, ObjectType, Int, ID } from 'type-graphql';
@ObjectType()
export class W7GSSOResponse {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  link: string;
}
