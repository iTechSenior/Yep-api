import { Field, ObjectType, InputType } from 'type-graphql';
import { PhoneTypeEnum } from '../Enums';
@ObjectType()
export class Phone {
  static fromPhone(data: Phone) {
    return new this(data.type, data.digits);
  }

  @Field(() => PhoneTypeEnum)
  public type: PhoneTypeEnum;

  @Field()
  public digits: string;

  @Field({ nullable: true })
  public extension?: string;

  constructor(type: PhoneTypeEnum, digits: string) {
    this.type = type;
    this.digits = digits;
  }
}
