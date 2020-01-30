import { Field, ObjectType, InputType } from 'type-graphql';
import { PhoneTypeEnum } from '../Enums';

@InputType()
export class PhoneInput {
  @Field(() => PhoneTypeEnum)
  public type: PhoneTypeEnum;

  @Field()
  public digits: string;

  @Field({ nullable: true })
  public extension?: string;
}
