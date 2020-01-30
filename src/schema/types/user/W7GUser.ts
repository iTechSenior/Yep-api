import { Field, ObjectType, Int, ID } from 'type-graphql';
@ObjectType()
export class W7GUser {
  @Field(() => ID, { nullable: true })
  memberId?: string;

  @Field({ nullable: true })
  mem_pass?: string;

  @Field({ nullable: true })
  upaCode?: string;

  @Field({ nullable: true })
  spCode?: string;

  @Field({ nullable: true })
  defaultPlacement?: string;

  @Field({ nullable: true })
  instantPlacement?: string;

  constructor(memberId: string = '', upaCode: string = '', spCode: string = '') {
    this.memberId = memberId;
    this.upaCode = upaCode;
    this.spCode = spCode;
  }
}
