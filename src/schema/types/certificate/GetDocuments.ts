import { Field, InputType, Int, ArgsType } from 'type-graphql';
@ArgsType()
export class GetDocuments {
  @Field()
  type: string;

  @Field(() => Int, { nullable: true })
  skip?: number;

  @Field(() => Int, { nullable: true })
  pageSize?: number;
}
