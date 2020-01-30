import { ObjectType, Field, Int, ArgsType } from 'type-graphql';
import { ContactEmailInfo } from './ContactEmailInfo';

@ObjectType()
export class ContactEmailCount {
  @Field(() => [ContactEmailInfo])
  contactEmail: ContactEmailInfo[];

  @Field(() => Int)
  totalRows: number;
}
