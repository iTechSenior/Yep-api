import { Field, InputType } from 'type-graphql';
@InputType()
export class UploadContactList {
  file: any;

  @Field()
  template: string;

  @Field()
  message: string;
}
