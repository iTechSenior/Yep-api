import { ObjectType, Field } from 'type-graphql';
@ObjectType()
export class TransferUser {
  @Field()
  email: string;

  @Field()
  fromRole: string;

  @Field()
  toRole: string;
}
