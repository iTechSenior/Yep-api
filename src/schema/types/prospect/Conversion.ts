import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Conversion {
  certficate: any;

  @Field()
  conversionDate: Date;

  @Field()
  ip: string;
}
