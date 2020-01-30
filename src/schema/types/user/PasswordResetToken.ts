import { Field, ObjectType, ID } from 'type-graphql';
import { IMetadataDictionary } from 'ravendb';

@ObjectType()
export class PasswordResetToken {
  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  userId: string;

  public '@metadata'?: IMetadataDictionary;

  constructor(id?: string, userId: string = '') {
    this.id = id;
    this.userId = userId;
  }
}
