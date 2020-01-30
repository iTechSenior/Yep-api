import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class DumpBucket {
  @Field(() => Int, { nullable: true })
  id?: string;

  @Field({ nullable: true })
  userId?: string;

  payload: any;

  constructor(id?: string, userId?: string, payload: any = {}) {
    this.id = id;
    this.userId = userId;
    this.payload = payload;
  }
}
