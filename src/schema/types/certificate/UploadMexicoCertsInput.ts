import { InputType, Field } from 'type-graphql';

@InputType()
export class UploadMexicoCertsInput {
  // @Field(() => any)
  @Field({ nullable: true })
  id?: string;

  file: any;
}
