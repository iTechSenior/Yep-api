import { Resolver, Query, Args, Ctx, Mutation, Arg } from 'type-graphql';
import { verifyAccess, Roles, Context, formatSearchTerm, createAndSendException } from '@/helpers/utils';
import { TablePaginationWithSearchTextArgs } from '@/types/TablePaginationWithSearchTextArgs';
import { ContentList, ShareableContent, ShareableContentInput } from '@/types/shareableContent';
import { QueryStatistics } from 'ravendb';
import { Category, Video, SubCategory } from '@/types/video';
import { TablePaginationWithSearchTextAndBrandArgs } from '@/types/TablePaginationWithSearchTextAndBrandArgs';
import { ShareableContentGrouped } from '@/types/shareableContent/ShareableContentGrouped';
import { find } from 'lodash';

@Resolver(() => ShareableContent)
export class ContentResolver {
  @Query(() => ContentList)
  async getAllContents(@Args() { searchText, skip, pageSize }: TablePaginationWithSearchTextArgs, @Ctx() { session }: Context): Promise<ContentList> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    let stats: QueryStatistics = null;
    const contents = session
      .query<ShareableContent>({ indexName: 'ShareableContents' })
      .statistics(s => (stats = s))
      .take(pageSize)
      .orderBy('updatedAt')
      .skip(skip);

    if (searchText) {
      contents.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    return { contents: await contents.all(), totalRows: stats.totalResults };
  }

  @Query(() => [ShareableContentGrouped])
  async getAllContentByBrand(
    @Args() { searchText, skip, pageSize, brand }: TablePaginationWithSearchTextAndBrandArgs,
    @Ctx() { session }: Context
  ): Promise<ShareableContentGrouped[]> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    let stats: QueryStatistics = null;
    const contents = session
      .query<ShareableContent>({ indexName: 'ShareableContents' })
      .whereEquals('brand', brand)
      .statistics(s => (stats = s))
      .take(pageSize)
      .orderBy('updatedAt')
      .skip(skip);

    if (searchText) {
      contents.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    const rawResults = await contents.all();
    const shareableContentGrouped: ShareableContentGrouped[] = [];
    if (rawResults.length > 0) {
      for (const content of rawResults) {
        const existing = find(shareableContentGrouped, clip => clip.category === content.subCategory);
        if (existing) {
          if (existing.shareableContent) {
            existing.shareableContent.push(content);
          } else existing.shareableContent = [content];
        } else {
          shareableContentGrouped.push({
            category: content.subCategory,
            shareableContent: [content],
          });
        }
      }
    }

    return shareableContentGrouped;
  }

  @Mutation(() => ShareableContent)
  async saveContent(@Arg('content', () => ShareableContentInput) content: ShareableContentInput, @Ctx() { session, req }: Context): Promise<ShareableContent> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      const entity = await ShareableContent.fromShareableContentInput(session, content);
      await session.saveChanges();

      return entity;
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, content));
      await session.saveChanges();
      throw new Error('There was an error. Please try again. The Tech Team has been notified.');
    }
  }

  @Query(() => ShareableContent)
  async getContentById(@Arg('id') id: string, @Ctx() { session }: Context): Promise<ShareableContent> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    if (id) return session.load<ShareableContent>(id);
    else return null;
  }

  @Query(() => [Category])
  async getAllContentCategories(@Arg('brand', () => String) brand: string, @Ctx() { session }: Context): Promise<Category[]> {
    // verifyAccess(ctx.req, [Roles.Administrator, Roles.Corporate]);
    const categories = await session
      .query<ShareableContent>({ indexName: 'ShareableContents' })
      .whereEquals('brand', brand)
      .selectFields('category')
      .ofType<Category>(Category)
      .distinct()
      .all();
    return categories;
  }

  @Query(() => [SubCategory])
  async getAllContentTagsByCategory(
    @Arg('category', () => String) category: string,
    @Arg('brand', () => String) brand: string,
    @Ctx() { session }: Context
  ): Promise<SubCategory[]> {
    // verifyAccess(ctx.req, [Roles.Administrator, Roles.Corporate]);
    const subCategory = await session
      .query<ShareableContent>({ indexName: 'ShareableContents' })
      .whereEquals('category', category)
      .andAlso()
      .whereEquals('brand', brand)
      .selectFields('subCategory')
      .ofType<SubCategory>(SubCategory)
      .distinct()
      .all();

    return subCategory;
  }
}
