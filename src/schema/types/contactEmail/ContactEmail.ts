import { ObjectType, Field, ID } from 'type-graphql';

@ObjectType()
export class ContactEmail {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  contactId: string;

  @Field()
  email: string;

  @Field()
  message: string;

  @Field()
  tag: string;

  @Field()
  createdAt: Date;

  constructor(contactId: string, createdAt: Date, email: string = '', message: string = '', tag: string = '', isSent: boolean = false, id?: string) {
    this.contactId = contactId;
    this.createdAt = createdAt;
    this.email = email;
    this.message = message;
    this.tag = tag;
    // this.isSent = isSent;
    this.id = id;
  }
}
