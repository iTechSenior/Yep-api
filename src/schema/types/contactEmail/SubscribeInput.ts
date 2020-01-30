import {InputType, Field} from 'type-graphql'

@InputType()
export class SubscribeInput{
    @Field()
    email:string
}