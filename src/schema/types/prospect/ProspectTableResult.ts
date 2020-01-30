import { ObjectType, Field, Int } from 'type-graphql';
import { ProspectBasics } from './ProspectBasics';
import { Prospect } from '.';

@ObjectType()
export class ProspectTableResult {
  @Field(() => [Prospect])
  prospects: Prospect[];

  @Field(() => Int)
  totalRows: number;

  constructor(prospects: Prospect[], totalRows: number) {
    this.prospects = prospects;
    this.totalRows = totalRows;
  }
}
