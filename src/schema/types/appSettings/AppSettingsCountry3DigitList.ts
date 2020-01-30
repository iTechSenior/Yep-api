import { ObjectType, Field } from 'type-graphql';
import { Country3DigitListItem } from './Country3DigitListItem';

@ObjectType()
export class AppSettingsCountry3DigitList {
  @Field(() => [Country3DigitListItem])
  data: Country3DigitListItem[];
  constructor(data: Country3DigitListItem[]) {
    this.data = data;
  }
}
