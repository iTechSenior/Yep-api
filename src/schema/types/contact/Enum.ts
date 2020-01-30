import { registerEnumType } from 'type-graphql';

export enum ContactStatusEnum {
  Subscribe = 'Subscribe',
  Unsubscribe = 'Unsubscribe',
  Denied = 'Denied',
}
registerEnumType(ContactStatusEnum, {
  name: 'ContactStatusEnum',
  description: 'Subscribe, Unsubscribe or Denied',
});
