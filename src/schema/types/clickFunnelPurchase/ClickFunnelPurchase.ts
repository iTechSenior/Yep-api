import { Field, ObjectType, ID } from 'type-graphql';

@ObjectType()
export class ClickFunnelPurchase {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  userId?: string;

  public payload: any;

  constructor(id?: string, userId?: string, payload: any = {}) {
    this.id = id;
    this.userId = userId;
    this.payload = payload;
  }
}
