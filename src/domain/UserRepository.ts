/**
 * User repository for aggregate persistence operations.
 *
 * @module UserRepository
 */

import * as Aggregate from "../framework/Aggregate.js";
import * as EventStore from "../framework/EventStore.js";
import * as User from "./User.js";

/**
 * Repository interface for user aggregate persistence.
 */
export interface UserRepository {
  /**
   * Retrieves a user aggregate by its ID.
   */
  readonly getById: (id: Aggregate.AggregateId) => User.UserAggregate;

  /**
   * Persists a user aggregate's uncommitted changes.
   */
  readonly save: (aggregate: User.UserAggregate) => User.UserAggregate;
}

/**
 * Creates a user repository backed by the given event store.
 *
 * @param store - The event store for user events
 * @returns A UserRepository instance
 */
export const make = (
  store: EventStore.EventStore<User.UserEvent>
): UserRepository => ({
  getById: (id) => {
    const events = store.loadEventsForAggregate(id, [
      "UserCreated",
      "FirstNameUpdated",
    ]);
    return User.loadFromHistory(id, events);
  },
  save: (aggregate) => EventStore.commit(aggregate, store),
});
