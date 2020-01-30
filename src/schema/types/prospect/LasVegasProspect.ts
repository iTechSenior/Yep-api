import { ObjectType, Field } from 'type-graphql';
import { PaymentType } from './PaymentType';

@ObjectType()
export class LasVegasProspect {
  @Field(() => [PaymentType], { nullable: true })
  payments?: PaymentType[];

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  deliveryEndpoint: string;

  @Field()
  deliveryMethod: string;

  @Field()
  updatedAt: Date;
}
