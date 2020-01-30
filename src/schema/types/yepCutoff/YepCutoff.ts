import { ObjectType, Field, Float, ID } from 'type-graphql';
import { User } from '../user';

@ObjectType()
export class YepCutoff {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  userId: string;

  @Field()
  sponsorId: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field({ defaultValue: '' })
  product: string;

  @Field()
  createdAt: Date;

  constructor(id?: string, userId: string = '', sponsorId: string = '', name: string = '', email: string = '', product: string = '') {
    this.id = id;
    this.userId = userId;
    this.sponsorId = sponsorId;
    this.name = name;
    this.email = email;
    this.product = product;
  }
}
