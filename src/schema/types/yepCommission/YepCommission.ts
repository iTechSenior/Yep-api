import { ObjectType, Field, Float, ID } from 'type-graphql';

@ObjectType()
export class YepCommission {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => Float)
  commission: number;

  @Field()
  orderId: string;

  @Field()
  type: string;

  @Field()
  userId: string;

  @Field()
  sponsorId: string;

  @Field()
  placement: string;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  userName: string;

  @Field()
  email: string;

  constructor(
    id?: string,
    commission: number = 0,
    orderId: string = '',
    type: string = '',
    userId: string = '',
    sponsorId: string = '',
    placement: string = 'Right',
    firstName: string = '',
    lastName: string = '',
    userName: string = '',
    email: string = ''
  ) {
    this.id = id;
    this.commission = commission;
    this.orderId = orderId;
    this.type = type;
    this.userId = userId;
    this.sponsorId = sponsorId;
    this.placement = placement;
    this.firstName = firstName;
    this.lastName = lastName;
    this.userName = userName;
    this.email = email;
  }
}
