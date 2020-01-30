import { ObjectType, Field, Int } from 'type-graphql';
import { YepCutoff } from '.';
@ObjectType()
export class YepCutoffList {
  @Field(() => [YepCutoff])
  users: YepCutoff[];

  @Field(() => Int)
  totalRows: number;
}
