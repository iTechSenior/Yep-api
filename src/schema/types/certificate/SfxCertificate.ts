import { ObjectType, Field, Int } from 'type-graphql';

@ObjectType()
export class SfxCertificate {
  @Field()
  code: string;

  @Field(() => Int)
  request_id: number;

  @Field()
  expires: Date;

  @Field()
  status: string;
}
