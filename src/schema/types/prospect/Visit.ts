import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class Visit {
  @Field()
  visitDate: Date;

  @Field()
  ip: string;

  @Field()
  url: string;

  constructor(visitDate: Date = null, ip: string = null, url: string = null) {
    this.visitDate = visitDate;
    this.ip = ip;
    this.url = url;
  }
}
