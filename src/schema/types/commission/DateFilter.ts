import { ObjectType, Field, GraphQLISODateTime, ArgsType, InputType } from 'type-graphql';

@InputType()
export class DateFilter {
  @Field(() => GraphQLISODateTime)
  value: Date;

  @Field()
  filter: string;
}
