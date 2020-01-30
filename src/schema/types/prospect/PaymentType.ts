import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class PaymentType {
  @Field()
  type: string;
}
