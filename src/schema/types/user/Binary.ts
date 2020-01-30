import { Field, ObjectType, Int } from 'type-graphql';

@ObjectType()
export class Binary {
  @Field({ nullable: true })
  parentUserId: string;

  @Field(() => Int)
  depth: number;

  @Field()
  placement: string;

  @Field()
  leg: 'Left' | 'Right'; // Left = 1, Right=2

  constructor(depth: number, parentUserId: string, placement: string, leg: 'Left' | 'Right') {
    this.depth = depth;
    this.parentUserId = parentUserId;
    this.placement = placement;
    this.leg = leg;
  }
}
