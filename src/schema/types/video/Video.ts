import { ObjectType, Field, Int, ID } from 'type-graphql';
import { UserReference } from '../user';
import { fetch } from 'apollo-env';
import { VideoInput } from '.';
import { IDocumentSession } from 'ravendb';
import { capitalizeEachFirstLetter, getNowUtc } from '@/helpers/utils';
import { JwtUser } from '../JwtUser';

@ObjectType()
export class Video {
  static async fromVideoInput(session: IDocumentSession, data: VideoInput, user: JwtUser) {
    let video: Video;
    const { id, videoTitle, trainer, subCategory, category, playlist, ...rest } = data;
    if (data.id) {
      video = await session.load(data.id);
    } else {
      video = new this(await UserReference.fromJwtUser(session, user.id), null, null, null, null, null, null, null, null, null, null, null, playlist);
      video.createdAt = getNowUtc();
      await session.store(video);
    }

    Object.assign(video, {
      ...rest,
      id,
      videoTitle: capitalizeEachFirstLetter(videoTitle),
      subCategory: capitalizeEachFirstLetter(subCategory),
      category: capitalizeEachFirstLetter(category),
      trainer: capitalizeEachFirstLetter(trainer),
      playlist: playlist,
      updatedAt: getNowUtc(),
    });
    return video;
  }

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field(() => UserReference)
  user: UserReference;

  @Field()
  videoTitle: string;

  @Field({ defaultValue: '' })
  videoUrl: string;

  @Field({ defaultValue: '' })
  videoS3Url: string;

  @Field({ defaultValue: '' })
  videoThumbnailUrl: string;

  @Field()
  category: string;

  @Field()
  subCategory: string;

  @Field()
  description: string;

  @Field()
  language: string;

  @Field()
  brand: string;

  @Field({ defaultValue: '' })
  trainer: string;

  @Field(() => Int, { nullable: true })
  displayOrder: number;

  @Field({ nullable: true })
  playlist: string;

  @Field({ nullable: true })
  createdAt?: Date;

  @Field({ nullable: true })
  updatedAt?: Date;

  constructor(
    user: UserReference,
    videoTitle: string = '',
    videoUrl: string = '',
    videoS3Url: string = '',
    videoThumbnailUrl: string = '',
    category: string = '',
    subCategory: string = '',
    description: string = '',
    language: string = '',
    trainer: string = '',
    brand: string = '',
    displayOrder: number = 0,
    playlist: string = ''
  ) {
    this.user = user;
    this.videoTitle = videoTitle;
    this.videoUrl = videoUrl;
    this.videoS3Url = videoS3Url;
    this.videoThumbnailUrl = videoThumbnailUrl;
    this.description = description;
    this.subCategory = subCategory;
    this.language = language;
    this.category = category;
    this.trainer = trainer;
    this.brand = brand;
    this.displayOrder = displayOrder;
    this.playlist = playlist;
  }
}
