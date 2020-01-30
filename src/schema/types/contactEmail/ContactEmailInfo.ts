import { ObjectType, Field } from 'type-graphql';
@ObjectType()
export class ContactEmailInfo {
  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  message: string;

  @Field()
  tag: string;

  @Field()
  createdAt: Date;

  @Field()
  isSent: boolean;
}
