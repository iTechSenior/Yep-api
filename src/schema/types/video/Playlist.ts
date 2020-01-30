import { ObjectType, Field, Int, ID, GraphQLISODateTime } from 'type-graphql';
import { IDocumentSession } from 'ravendb';
import { PlaylistArgs, Video, DisplayOrder } from '.';
import { capitalizeEachFirstLetter, getNowUtc } from '@/helpers/utils';
import { VideoStatusEnum } from '../Enums';

@ObjectType()
export class Playlist {
  static async fromPlaylistArgs(session: IDocumentSession, data: PlaylistArgs) {
    let playlist: Playlist;
    console.log('data', data);
    const { id, title, trainer, category, subCategory, videos, ...rest } = data;
    if (id) {
      playlist = await session.load(id);
    } else {
      playlist = new this(
        capitalizeEachFirstLetter(title),
        capitalizeEachFirstLetter(trainer),
        capitalizeEachFirstLetter(category),
        capitalizeEachFirstLetter(subCategory),
        data.thumbnailUrl
      );
      playlist.createdAt = getNowUtc();
      await session.store(playlist);
    }
    Object.assign(playlist, {
      ...rest,
      title: capitalizeEachFirstLetter(title),
      trainer: capitalizeEachFirstLetter(trainer),
      category: capitalizeEachFirstLetter(category),
      subCategory: capitalizeEachFirstLetter(subCategory),
      updatedAt: getNowUtc(),
    });

    // Update displayOrders
    videos.map(async (video: DisplayOrder, index: number) => {
      const myVideo: Video = await session.load(video.videoId);
      myVideo.displayOrder = video.displayOrder;
      await session.saveChanges();
    });

    return playlist;
  }

  @Field(() => ID, { nullable: true })
  id?: string;

  @Field()
  title: string;

  @Field({ defaultValue: '' })
  description: string;

  @Field()
  trainer: string;

  @Field({ nullable: true, defaultValue: '' })
  category: string;

  @Field({ defaultValue: '' })
  subCategory: string;

  @Field({ defaultValue: '' })
  thumbnailUrl: string;

  @Field(() => VideoStatusEnum, { defaultValue: false })
  status: VideoStatusEnum;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt?: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt?: Date;

  constructor(title: string, trainer: string, category: string, subCategory: string, thumbnailUrl: string) {
    this.title = title;
    this.trainer = trainer;
    this.category = category;
    this.subCategory = subCategory;
    this.thumbnailUrl = thumbnailUrl;
  }
}
