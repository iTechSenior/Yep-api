import { Field, ObjectType, Int } from 'type-graphql';
import { FieldStat } from 'apollo-engine-reporting-protobuf';
@ObjectType()
export class Ancestry {
  @Field({ nullable: true })
  parentUserId?: string;

  @Field({ nullable: true })
  ancestors?: string;

  @Field(() => Int)
  depth: number;

  constructor(depth: number, parentUserId?: string, ancestors?: string) {
    this.depth = depth;
    this.parentUserId = parentUserId;
    this.ancestors = ancestors;
  }
}
