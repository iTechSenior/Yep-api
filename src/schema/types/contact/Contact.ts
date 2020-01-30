import { ObjectType, Field, ID } from 'type-graphql';
import { UserReference } from '@/types/user';
import { DateTime } from 'luxon';
import { ContactStatusEnum } from './Enum';

@ObjectType()
export class Contact {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  uuid: string;

  @Field(() => UserReference)
  user: UserReference;

  @Field()
  firstName: string;

  @Field()
  lastName: string;

  @Field()
  email: string;

  @Field()
  tag: string;

  @Field()
  status: ContactStatusEnum; // 'New' | 'Warm' | 'Hot' | 'Follow-Up Later' | 'Team Member' | 'Customer';

  @Field()
  subscribe: boolean;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    uuid: string,
    user: UserReference,
    firstName: string = '',
    lastName: string = '',
    email: string = '',
    tag: string = '',
    subscribe: boolean,
    status: ContactStatusEnum = ContactStatusEnum.Denied,
    id?: string
  ) {
    this.uuid = uuid;
    this.user = user;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.tag = tag;
    this.subscribe = subscribe;
    this.status = status;
    this.createdAt = DateTime.utc().toJSDate();
    this.updatedAt = this.createdAt;
  }
}
