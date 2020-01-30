import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class ProPayDisburseFund {
  @Field()
  success: boolean;

  @Field({ nullable: true })
  message?: string;

  @Field({ nullable: true })
  status?: string;

  @Field({ nullable: true })
  transNum?: string;

  @Field({ nullable: true })
  invNum?: string;
}
