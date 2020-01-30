import { Field, ObjectType, ID, Int } from 'type-graphql';

@ObjectType()
export class Exception {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  anyId?: string;

  @Field({ nullable: true })
  location?: string;

  @Field()
  errorMessage: string;

  // @Field()
  data: any;

  constructor(id?: string, anyId?: string, location?: string, errorMessage: string = '', data: any = {}) {
    this.id = id;
    this.anyId = anyId;
    this.location = location;
    this.errorMessage = errorMessage;
    this.data = data;
  }
}
