import { Field, ObjectType, InputType } from 'type-graphql';
import { ProspectCustomer } from './ProspectCustomer';

@InputType()
export class AddMultipleProspects {
  @Field(() => [ProspectCustomer])
  customers: ProspectCustomer[];

  @Field({ nullable: true })
  certificateId: string;

  @Field({ nullable: true })
  personalizedMessage: string;
}
