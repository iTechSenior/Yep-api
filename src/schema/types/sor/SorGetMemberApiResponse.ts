import { ObjectType, Field } from 'type-graphql';
import { APIMessageResponse } from '../common';
import { ISorMember } from '@/helpers/interfaces';

@ObjectType()
export class SorGetMemberApiResponse extends APIMessageResponse {
  sorMember?: ISorMember;
}
