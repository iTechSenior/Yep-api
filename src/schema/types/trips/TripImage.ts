import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
export class TripImage {
  // @Field()
  // type: 'Background' | 'Primary' | 'Gallery' | 'Property' | 'Room' | 'Header' | 'Footer' | 'Promotional';

  @Field()
  url: string;

  @Field(() => Int, { nullable: true })
  displayOrder?: number;
}
