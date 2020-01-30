import { InputType, Field } from 'type-graphql';

@InputType()
export class ProPayCommissionInput {
  @Field()
  commissionId: string;
}
