import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class YepHoldingUser {
  @Field(() => ID)
  id: string;

  @Field()
  name: string;

  @Field()
  email: string;

  @Field()
  placement: string;

  constructor(id: string = '', name: string = '', email: string = '', placement: string = 'Right') {
    this.id = id;
    this.name = name;
    this.email = email;
    this.placement = placement;
  }
}
