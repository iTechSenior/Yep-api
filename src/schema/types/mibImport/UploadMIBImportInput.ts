import { InputType, Field, ObjectType } from 'type-graphql';
import { Upload } from '@/resolvers/scalars/upload';

@InputType()
export class UploadMIBImportInput {
  // @Field(() => any)
  @Field({ nullable: true })
  id?: string;

  @Field(() => Upload)
  readonly file: any;
}
