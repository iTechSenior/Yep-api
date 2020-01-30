import { ObjectType, Field } from 'type-graphql';
import { CountryListItem } from './CountryListItem';

@ObjectType()
export class AppSettingsCountryList {
  @Field(() => [CountryListItem])
  data: CountryListItem[];
  constructor(data: CountryListItem[]) {
    this.data = data;
  }
}
