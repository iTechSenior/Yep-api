import { Context } from '@/helpers/interfaces';
import { Resolver, Query, Ctx, Args, Arg, Mutation } from 'type-graphql';
import { QueryStatistics } from 'ravendb';
import { Event, EventList, GetLocalEventsArgs, UpdateEventArgs, Coordinate } from '@/types/event';
// import { User } from '@/types/user';
import { APIMessageResponse } from '@/types/common';
import zipcodes from 'zipcodes';
import { verifyAccess, Roles, formatSearchTerm } from '@/helpers/utils';
import { SaveEventArgs } from '@/types/event/SaveEventArgs';

// // @ts-ignore
// import moment from 'moment-weekdaysin';
import { GetLocalEventsForMobileArgs } from '@/types/event/GetLocalEventsArgs';
// import shortid from 'shortid';
// import { Moment } from 'moment';
import moment, { Moment } from 'moment';
import { clone, orderBy, find } from 'lodash';
import { MobileEventList } from '@/types/event/MobileEventList';
import { MobileEvent } from '@/types/event/MobileEvent';
import { MobileEventsGroupByDay } from '@/types/event/MobileEventsGroupByDay';

@Resolver(() => Event)
export class EventResolver {
  @Mutation(() => Event)
  async saveEvent(@Args() args: SaveEventArgs, @Ctx() { session, req }: Context): Promise<Event> {
    verifyAccess(req, [Roles.Administrator, Roles.YEPLocal]);
    const entity = Event.fromSaveEventArgs(session, args, req.user);
    await session.saveChanges();
    return entity;
  }

  @Mutation(() => APIMessageResponse)
  async removeEvent(@Arg('id') id: string, @Ctx() { session }: Context): Promise<APIMessageResponse> {
    try {
      await session.delete(id);
      await session.saveChanges();
      return { success: true, message: 'deleted' };
    } catch (e) {
      return { success: false, message: e };
    }
  }

  @Mutation(() => Event)
  async updateEvent(@Args() args: UpdateEventArgs, @Ctx() { session }: Context): Promise<Event> {
    const event = await session.load<Event>(args.eventId);

    let coordinate: Coordinate | null;
    if (args.address) {
      const location = zipcodes.lookup(args.address.zip);
      coordinate = location ? { lat: location.latitude, lng: location.longitude } : null;
    } else {
      coordinate = null;
    }
    Object.assign(event, { coordinate, ...args });
    event.updatedAt = new Date();
    await session.saveChanges();

    return event;
  }

  @Query(() => EventList)
  async getLocalEvents(@Args() { zip }: GetLocalEventsArgs, @Ctx() { session }: Context): Promise<EventList> {
    let stats: QueryStatistics;
    let locationEvents: Event[];
    let totalLocationEvents = 0;

    const location = zipcodes.lookup(zip);
    if (!location) {
      return { events: [], totalRow: 0 };
    }

    const query = await session
      .query<Event>({ indexName: 'Events' })
      .statistics(s => (stats = s))
      .whereEquals('type', 'Location')
      .whereEquals('publish', true);
    // .spatial('coordinates', f => f.withinRadius(450, location.latitude, location.longitude))
    // .orderByDistance('coordinates', location.latitude, location.longitude);

    locationEvents = await query.all();
    totalLocationEvents = stats.totalResults;

    const webinarEvents = await session
      .query<Event>({ indexName: 'Events' })
      .statistics(s => (stats = s))
      .whereEquals('type', 'Webinar')
      .all();
    const totalWebinarEvents = stats.totalResults;

    return { events: [...locationEvents, ...webinarEvents], totalRow: totalLocationEvents + totalWebinarEvents };
  }

  @Query(() => EventList)
  async getMyEvents(@Ctx() { session, req }: Context): Promise<EventList> {
    verifyAccess(req, ['YEP LOCAL']);

    let stats: QueryStatistics;

    const query = await session
      .query<Event>({ indexName: 'Events' })
      .statistics(s => (stats = s))
      .whereEquals('userId', req.user!.id)
      .all();

    return { events: query, totalRow: stats.totalResults };
  }

  @Query(() => Event)
  async getEventById(@Arg('id') id: string, @Ctx() { session, req }: Context): Promise<Event> {
    verifyAccess(req, ['YEP LOCAL']);
    return session.load<Event>(id);
  }

  getAllDaysInMonth = (date: string, day: string): Moment[] => {
    const moments: Moment[] = [];
    const anyDay = moment(date).day(day);
    if (anyDay.date() > 7) anyDay.add(7, 'd');
    const month = anyDay.month();
    while (month === anyDay.month()) {
      moments.push(anyDay.clone());
      anyDay.add(7, 'd');
    }
    return moments;
  };

  @Query(() => MobileEventList)
  async getLocalEventsForMobile(@Args() { month, year, searchText }: GetLocalEventsForMobileArgs, @Ctx() { session, req }: Context): Promise<MobileEventList> {
    const dateIn = `${year}-${month}-01`;
    const startDate = moment(dateIn);
    const endDate = moment(startDate).endOf('month');
    const allLocationEvents = session
      .query<Event>({ indexName: 'Events' })
      .whereEquals('type', 'Location')
      .whereEquals('publish', true)
      .openSubclause()
      .whereBetween('when', startDate.toISOString(), endDate.toISOString())
      .orElse()
      .whereIn('recurringDaysOfWeek', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .closeSubclause();

    if (searchText) {
      allLocationEvents.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }
    // .spatial('coordinates', f => f.withinRadius(450, location.latitude, location.longitude))
    // .orderByDistance('coordinates', location.latitude, location.longitude);

    let allEvents: MobileEvent[] = [];
    for (const e of await allLocationEvents.all()) {
      if (e.recurringDaysOfWeek && e.recurringDaysOfWeek.length > 0) {
        let dates: Moment[] = [];
        e.recurringDaysOfWeek!.forEach(r => {
          const currentDates = this.getAllDaysInMonth(dateIn, r);
          dates = dates.concat(...currentDates);
        });
        for (const date of dates) {
          const r = clone(e);
          r.when = date.toDate();
          allEvents.push(await MobileEvent.fromEvent(session, r, req.user));
        }
      } else allEvents.push(await MobileEvent.fromEvent(session, e, req.user));
    }

    const allWebinarEvents = session
      .query<Event>({ indexName: 'Events' })
      .whereEquals('type', 'Webinar')
      .whereEquals('publish', true)
      .openSubclause()
      .whereBetween('when', startDate.toISOString(), endDate.toISOString())
      .orElse()
      .whereIn('recurringDaysOfWeek', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
      .closeSubclause();

    if (searchText) {
      allWebinarEvents.andAlso().search('Query', formatSearchTerm(searchText.split(' ')), 'AND');
    }

    for (const e of await allWebinarEvents.all()) {
      if (e.recurringDaysOfWeek && e.recurringDaysOfWeek.length > 0) {
        let dates: Moment[] = [];
        e.recurringDaysOfWeek!.forEach(r => {
          const currentDates = this.getAllDaysInMonth(dateIn, r);
          dates = dates.concat(...currentDates);
        });
        for (const date of dates) {
          const r = clone(e);
          r.when = date.toDate();
          allEvents.push(await MobileEvent.fromEvent(session, r, req.user));
        }
      } else allEvents.push(await MobileEvent.fromEvent(session, e, req.user));
    }

    allEvents = orderBy(allEvents, e => e.when);

    const groupedEvents: MobileEventsGroupByDay[] = [];
    for (const event of allEvents) {
      const existing = find(groupedEvents, e => e.day === moment(event.when).format('YYYY-MM-DD'));
      if (existing) {
        if (existing.events) {
          existing.events.push(event);
        } else existing.events = [event];
      } else {
        groupedEvents.push({
          day: moment(event.when).format('YYYY-MM-DD'),
          events: [event],
        });
      }
    }

    return { groupedEvents: groupedEvents, totalRows: allEvents.length };
  }
}
