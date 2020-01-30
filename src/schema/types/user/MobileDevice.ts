import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class MobileDevice {
  @Field()
  deviceId: string;

  constructor(deviceId: string) {
    this.deviceId = deviceId;
  }
}
