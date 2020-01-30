import { Field, InputType } from 'type-graphql';
import { FieldStat } from 'apollo-engine-reporting-protobuf';
@InputType()
export class AncestryInput {
  @Field({ nullable: true })
  parentUserId: string;

  @Field({ nullable: true })
  ancestors: string;

  @Field()
  depth: number;

}
