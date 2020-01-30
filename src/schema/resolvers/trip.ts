import { Resolver, Mutation, Arg, Args, Query, Ctx } from 'type-graphql';
import { Trip, AddTripArgs } from '@/types/trips';
import { Context } from '@/helpers/interfaces';
import { Roles, verifyAccess, getNowUtc, convertToUrlSlug, createAndSendException } from '@/helpers/utils';

@Resolver()
export class TripResolver {
  @Query(() => Trip)
  async getTrip(@Arg('id') id: string, @Ctx() { session, req }: Context): Promise<Trip> {
    verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      return await session.load<Trip>(id);
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, id));
      await session.saveChanges();
      throw new Error('Trip Not Found');
    }
  }

  @Query(() => Trip)
  async getTripBySlug(@Arg('urlSlug') urlSlug: string, @Ctx() { session, req }: Context): Promise<Trip> {
    // verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
    try {
      return await session
        .query<Trip>({ collection: 'Trips' })
        .whereIn('urlSlug', [urlSlug])
        .singleOrNull();
    } catch (ex) {
      await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, urlSlug));
      await session.saveChanges();
      throw new Error('Trip Not Found');
    }
  }

  @Query(() => [Trip])
  async getTrips(@Ctx() { session, req }: Context): Promise<Trip[]> {
    verifyAccess(req, [Roles.Administrator]);
    return await session.query<Trip>({ collection: 'Trips' }).all();
  }

  //   @Mutation(() => Trip)
  //   async addTrip(@Args() { trip }: AddTripArgs, { session, req }: Context): Promise<Trip> {
  //     try {
  //       verifyAccess(req, [Roles.TVIPro, Roles.TVIPlus, Roles.TVIBasic]);
  //       const { agenda, dates, location, hotel, title, includes, images, ...rest } = trip;
  //       let newTrip = new Trip(agenda, dates, location, hotel, includes, images, title);
  //       newTrip = { ...trip, ...rest, createdAt: getNowUtc(), updatedAt: getNowUtc(), urlSlug: [convertToUrlSlug(title).toLowerCase()] };

  //       await session.store(trip);
  //       await session.saveChanges();
  //       return trip;
  //     } catch (ex) {
  //       await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, trip));
  //       await session.saveChanges();
  //       throw new Error('There was an error. Please try again. The Tech Team has been notified.');
  //     }
  //   }
  // async editTrip(_parent, args: TripInterfaces.ITrip, { session }: Context): Promise<TripInterfaces.ITrip> {
  //   try {
  //     let trip = await session.load<Trip>(args.id);

  //     if (!trip) {
  //       return null;
  //     }

  //     trip = Object.assign(trip, { ...args, lastUpdated: new Date() });
  //     await session.saveChanges();
  //     return trip;
  //   } catch (ex) {
  //     await session.store(await createAndSendException(null, new Error(ex.message).stack, ex.message, args));
  //     await session.saveChanges();
  //     throw new Error('There was an error. Please try again. The Tech team has been notified.');
  //   }
  // },
}
