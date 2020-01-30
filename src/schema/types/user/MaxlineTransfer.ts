import { Field, ObjectType, Int, ID } from 'type-graphql';
@ObjectType()
export class MaxlineTransfer {
  @Field(() => ID)
  id?: string;

  @Field()
  token?: string;

  @Field({ nullable: true })
  userId?: string;

  @Field({ nullable: true })
  sponsorId?: string;

  @Field()
  email: string;

  @Field()
  username: string;

  @Field({ nullable: true })
  yepId?: string;

  @Field({ nullable: true })
  maxlineId?: string;

  @Field({ nullable: true })
  maxlineEnrollerId?: string;

  constructor(
    username: string,
    email: string,
    token: string,
    yepId: string,
    userId: string = '',
    sponsorId: string = '',
    maxlineId: string = '',
    maxlineEnrollerId: string = ''
  ) {
    this.email = email;
    this.username = username;
    this.token = token;
    this.yepId = yepId;
    this.userId = userId;
    this.sponsorId = sponsorId;
    this.maxlineId = maxlineId;
    this.maxlineEnrollerId = maxlineEnrollerId;
  }
}
