import { ObjectType, Field } from 'type-graphql';
import { YepBanner } from './YepBanner';

@ObjectType()
export class AppSettingsYepBannerList {
  @Field(() => [YepBanner])
  data: YepBanner[];

  constructor(data: YepBanner[]) {
    this.data = data;
  }
}
