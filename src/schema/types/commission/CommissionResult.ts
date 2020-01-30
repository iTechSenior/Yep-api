import { ArgsType, Field, ObjectType } from 'type-graphql';

@ObjectType()
export class CommissionResult {
  @Field()
  success: boolean;

  @Field()
  message: string;

  constructor(success: boolean, message: string) {
    this.success = success;
    this.message = message;
  }
}
