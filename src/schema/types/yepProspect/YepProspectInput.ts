import { InputType, Field } from 'type-graphql';
import { YepProspectReceiver } from './YepProspectReceiver';

@InputType()
export class YepProspectInput {
  @Field(() => [YepProspectReceiver])
  receivers: YepProspectReceiver[];

  @Field({ nullable: true })
  categoryId: string;

  @Field({ nullable: true })
  personalizedMessage: string;
}

@InputType()
export class YepProspectSharedContentInput {
  @Field(() => YepProspectReceiver)
  prospect: YepProspectReceiver;

  @Field({ nullable: true })
  contentId: string;

  @Field({ nullable: true })
  personalizedMessage: string;
}
