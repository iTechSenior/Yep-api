import { Resolver, Mutation, Ctx, Arg, Args, Query } from 'type-graphql';
import { Context, verifyAccess, Roles, createAndSendException, formatSearchTerm } from '@/helpers/utils';
import {
  Video,
  VideoInput,
  GetVideosArgs,
  VideoAndTotalRows,
  SubCategory,
  Category,
  PlaylistArgs,
  PlaylistResponse,
  Playlist,
  PlaylistReference,
  VideosByPlayList,
} from '@/types/video';
import { APIMessageResponse } from '@/types/common';
import { QueryStatistics } from 'ravendb';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { TablePaginationWithSearchTextAndBrandArgs } from '@/types/TablePaginationWithSearchTextAndBrandArgs';
import { find, findIndex } from 'lodash';
import { YepClips, YepClipsPlaylistsGroupedByCategory } from '@/types/video/YepClips';
import { YepVideoByIdResponse } from '@/types/video/YepVideoByIdResponse';
import { PlaylistWithVideoResponse } from '@/types/video/PlaylistWithVideoResponse';

@Resolver()
export class VideoResolver {
  @Query(() => Video)
  async getVideoById(@Arg('id') id: string, @Ctx() { session }: Context): Promise<Video> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    if (id) return session.load<Video>(id);
    else return null;
  }

  @Query(() => YepVideoByIdResponse)
  async getYepVideoById(@Arg('id') id: string, @Ctx() { session }: Context): Promise<YepVideoByIdResponse> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    const video = await session.load<Video>(id);
    const related = await session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('playlist', video.playlist)
      .not()
      .whereEquals('videoTitle', video.videoTitle)
      .orderBy('displayOrder', 'Long')
      .all();
    return { video, related };
  }

  @Query(() => [Video])
  async getVideos(@Args() { category, subCategory }: GetVideosArgs, @Ctx() { session }: Context): Promise<Video[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    return session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('category', category)
      .whereEquals('subCategory', subCategory)
      .whereEquals('brand', 'TripValet')
      .all();
  }

  @Query(() => VideoAndTotalRows)
  async getAllVideosByUser(
    @Args() { searchText, skip, pageSize }: TablePaginationWithSearchTextArgs,
    @Ctx() { session, req }: Context
  ): Promise<VideoAndTotalRows> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    let stats: QueryStatistics = null;
    const videos = session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('brand', 'YEP')
      .statistics(s => (stats = s))
      .take(pageSize)
      .orderByDescending('updatedAt')
      .skip(skip);

    if (findIndex(req.user.roles, role => role === 'YEP Video Admin') < 0) {
      videos.andAlso().whereEquals('userId', req.user.id);
    }

    if (searchText) {
      videos.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const myVideos: Video[] = await videos.all();
    return { videos: myVideos, totalRows: stats.totalResults };
  }

  @Query(() => VideoAndTotalRows)
  async getAllVideos(
    @Args() { searchText, skip, pageSize, brand }: TablePaginationWithSearchTextAndBrandArgs,
    @Ctx() { session }: Context
  ): Promise<VideoAndTotalRows> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    let stats: QueryStatistics = null;
    const videos = session
      .query<Video>({ indexName: 'Videos' })
      .statistics(s => (stats = s))
      .whereEquals('brand', brand)
      .take(pageSize)
      .orderBy('updatedAt')
      .skip(skip);

    if (searchText) {
      videos.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    return { videos: await videos.all(), totalRows: stats.totalResults };
  }

  @Query(() => [YepClips])
  async getYepClips(
    @Args() { searchText, skip, pageSize, brand }: TablePaginationWithSearchTextAndBrandArgs,
    @Ctx() { session }: Context
  ): Promise<YepClips[]> {
    const videos = session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('brand', brand)
      .take(pageSize)
      .orderBy('updatedAt')
      .skip(skip);

    if (searchText) {
      videos.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const rawResults = await videos.all();
    const yepClips: YepClips[] = [];
    if (rawResults.length > 0) {
      for (const video of rawResults) {
        const existing = find(yepClips, clip => clip.category === video.category);
        if (existing) {
          if (existing.videos) {
            existing.videos.push(video);
          } else existing.videos = [video];
        } else {
          yepClips.push({
            category: video.category,
            videos: [video],
          });
        }
      }
    }

    return yepClips;
  }

  @Query(() => [YepClipsPlaylistsGroupedByCategory])
  async getYepClipsPlaylists(
    @Args() { searchText, skip, pageSize, brand }: TablePaginationWithSearchTextAndBrandArgs,
    @Ctx() { session }: Context
  ): Promise<YepClipsPlaylistsGroupedByCategory[]> {
    const playlists = session
      .query<Playlist>({ indexName: 'Playlists' })
      .whereEquals('status', 'published')
      .orderBy('category')
      .skip(skip);

    if (searchText) {
      playlists.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const rawResults = await playlists.all();
    const yepClips: YepClipsPlaylistsGroupedByCategory[] = [];
    if (rawResults.length > 0) {
      for (const playlist of rawResults) {
        const existing = find(yepClips, clip => clip.category === playlist.category);
        if (existing) {
          if (existing.playlists) {
            existing.playlists.push(playlist);
          } else existing.playlists = [playlist];
        } else {
          yepClips.push({
            category: playlist.category,
            playlists: [playlist],
          });
        }
      }
    }

    return yepClips;
  }

  @Query(() => [Category])
  async getAllVideoCategories(@Arg('brand', () => String) brand: string, @Ctx() { session }: Context): Promise<Category[]> {
    // verifyAccess(ctx.req, [Roles.Administrator, Roles.Corporate]);
    const categories = await session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('brand', brand)
      .selectFields('category')
      .ofType<Category>(Category)
      .distinct()
      .all();
    return categories;
  }

  @Query(() => [SubCategory])
  async getAllVideoTagsByCategory(
    @Arg('category', () => String) category: string,
    @Arg('brand', () => String) brand: string,
    @Ctx() { session }: Context
  ): Promise<SubCategory[]> {
    // verifyAccess(ctx.req, [Roles.Administrator, Roles.Corporate]);
    const subCategory = await session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('category', category)
      .andAlso()
      .whereEquals('brand', brand)
      .selectFields('subCategory')
      .ofType<SubCategory>(SubCategory)
      .distinct()
      .all();

    return subCategory;
  }

  // @Query(() => Video)
  // async getVideoById(@Args() { id }: VideoIdArgs, @Ctx() { session, req }: Context): Promise<Video> {
  //   verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
  //   return session.load<Video>(id);
  // }

  @Query(() => PlaylistResponse)
  async getPlaylists(@Ctx() { session }: Context): Promise<PlaylistResponse> {
    let stats: QueryStatistics;

    const query = await session
      .query<Playlist>({ indexName: 'Playlists' })
      .statistics(s => (stats = s))
      .all();

    return { playLists: query, totalRows: stats.totalResults };
  }

  @Query(() => PlaylistResponse)
  async getPublishedPlaylists(@Ctx() { session }: Context): Promise<PlaylistResponse> {
    let stats: QueryStatistics;

    const query = await session
      .query<Playlist>({ indexName: 'Playlists' })
      .statistics(s => (stats = s))
      .whereEquals('status', 'Published')
      .all();

    return { playLists: query, totalRows: stats.totalResults };
  }

  @Mutation(() => [PlaylistReference])
  async findPlaylistsForSelect(@Arg('searchText', () => String) searchText: string, @Ctx() { session }: Context): Promise<PlaylistReference[]> {
    const playlists = await session
      .query<Playlist>({ indexName: 'Playlists' })
      .search('Query', formatSearchTerm(searchText.split(' ')), 'AND')
      .selectFields<PlaylistReference>(['id', 'title'])
      .all();

    return playlists;
  }

  // @Query(() => PlaylistResponse)
  // async getPlaylists(
  //   @Args() { searchText, skip, pageSize }: TablePaginationWithSearchTextAndBrandArgs,
  //   @Ctx() { session, req }: Context
  // ): Promise<PlaylistResponse> {
  //   let stats: QueryStatistics = null;
  //   const playLists = session
  //     .query<Playlist>({ indexName: 'Playlists' })
  //     .statistics(s => (stats = s))
  //     //.whereEquals('brand', brand)
  //     .take(pageSize)
  //     .orderBy('updatedAt')
  //     .skip(skip);

  //   if (searchText) {
  //     playLists.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
  //   }
  //   const rawResults = await playLists.all();

  //   return { playLists: rawResults, totalRows: stats.totalResults };
  // }

  @Mutation(() => Video)
  async saveVideo(@Arg('video', () => VideoInput) video: VideoInput, @Ctx() { session, req }: Context): Promise<Video> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      const entity = await Video.fromVideoInput(session, video, req.user);
      await session.saveChanges();

      return entity;
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, video));
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech Team has been notified.');
    }
  }

  @Mutation(() => APIMessageResponse)
  async removeVideo(@Arg('videoId', () => String) videoId: string, @Ctx() { session, req }: Context): Promise<APIMessageResponse> {
    try {
      verifyAccess(req, [Roles.Administrator]);
      await session.delete(videoId);
      await session.saveChanges();
      return { success: true, message: 'deleted' };
    } catch (e) {
      return { success: false, message: e };
    }
  }

  @Mutation(() => APIMessageResponse)
  async savePlaylist(@Args() args: PlaylistArgs, @Ctx() { session }: Context): Promise<APIMessageResponse> {
    await Playlist.fromPlaylistArgs(session, args);
    await session.saveChanges();

    return { success: true };
  }

  @Query(() => Playlist)
  async getPlaylistById(@Arg('id') id: string, @Ctx() { session }: Context): Promise<Playlist> {
    // verifyAccess(req, ['YEP LOCAL']);
    return session.load<Playlist>(id);
  }

  @Query(() => PlaylistWithVideoResponse)
  async getYepPlaylistByIdWithVideos(@Arg('id') id: string, @Ctx() { session }: Context): Promise<PlaylistWithVideoResponse> {
    // verifyAccess(req, ['YEP LOCAL']);
    const playlist = await session.load<Playlist>(id);

    const videos = await session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('playlist', id)
      .orderBy('displayOrder', 'Long')
      .all();

    return { playlist, videos };
  }

  @Query(() => VideosByPlayList)
  async getVideosByPlaylist(@Arg('id') id: string, @Ctx() { session, req }: Context): Promise<VideosByPlayList> {
    const videos = await session
      .query<Video>({ indexName: 'Videos' })
      .whereEquals('playlist', id)
      .orderBy('displayOrder', 'Long')
      .all();

    return { videos };
  }

  // @Mutation(() => [PlaylistReference])
  // async findPlaylistForSelect(
  //   @Args() { searchText, clientId }: SearchTextClientIdForSelectionArgs,
  //   @Ctx() { session, req }: Context
  // )Promise<PlaylistReference[]> {
  //   return session
  //     .query<Playlist>({ indexName: 'Playlists' })
  //     .orderByDescending('name')
  //     .search('name', formatSearchTerm(searchText.split(' ')), 'AND')
  //     .andAlso()
  //     .whereEquals('clientId', clientId)
  //     .selectFields<PlaylistReference>(['id', 'name'])
  //     .take(15)
  //     .all();
  // }
}
