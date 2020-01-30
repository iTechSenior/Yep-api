import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Ambassador {
  @Field()
  updatedAt: Date;

  @Field()
  isSubscribed: boolean;

  @Field()
  email: string;

  @Field()
  remoteLoginId: string;

  @Field()
  lastName: string;

  @Field()
  firstName: string;

  @Field()
  id: string;

  @Field()
  status: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field()
  stripeCustomerId: string;

  @Field()
  stripeCardSource: string;

  @Field()
  phone: string;

  @Field()
  password: string;
}
