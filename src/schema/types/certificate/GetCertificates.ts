import { Field, InputType, Int, ArgsType } from 'type-graphql';

@ArgsType()
export class GetCertificates {
  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => [String], { nullable: true })
  membershipLevel?: Array<'TVI PLUS' | 'TVI PRO' | 'TVI BASIC'>;
}
