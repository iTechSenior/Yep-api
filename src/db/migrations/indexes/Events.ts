import { AbstractIndexCreationTask } from 'ravendb';

class Events extends AbstractIndexCreationTask {
  public constructor() {
    super();
    this.map = `from events in docs.Events
    select new {
        Query = new {
          city = events.address.city,
          zip = events.address.zip,
          coordinates = CreateSpatialField(events.coordinate.lat, events.coordinate.lng),
          type = events.type
        },
        city = events.address.city,
        zip = events.address.zip,
        when = events.when,
        type = events.type,
        userId = events.userId,
        address = events.address,
        coordinates = CreateSpatialField(events.coordinate.lat, events.coordinate.lng),
        description = events.description,
        publish = events.publish,
        createdAt = events.createdAt,
        updatedAt = events.updatedAt
    }`;
  }
}

export { Events };
