import { Context } from '@/helpers/interfaces';
import { Resolver, Arg, Ctx, Mutation } from 'type-graphql';

@Resolver()
export class CommonResolver {
  //#region Queries

  //#endregion

  //#region Mutations

  @Mutation(() => Boolean)
  async delete(@Arg('id') id: string, @Ctx() { session }: Context): Promise<boolean> {
    await session.delete(id);
    await session.saveChanges();
    return true;
  }

  //#endregion
}
