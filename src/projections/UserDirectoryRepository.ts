/**
 * User directory projection repository.
 *
 * @module UserDirectoryRepository
 */

import * as EventStore from "../framework/EventStore.js";
import * as User from "../domain/User.js";
import * as UserDirectory from "./UserDirectory.js";

/**
 * Repository interface for user directory projection.
 */
export interface UserDirectoryRepository {
  /**
   * Loads the user directory containing only users with phone numbers.
   */
  readonly load: () => UserDirectory.UserDirectory;
}

/**
 * Creates a user directory repository backed by the given event store.
 *
 * @param store - The event store for user events
 * @returns A UserDirectoryRepository instance
 */
export const make = (
  store: EventStore.EventStore<User.UserEvent>
): UserDirectoryRepository => ({
  load: () => {
    const events = store.loadEvents([
      "UserCreated",
      "FirstNameUpdated",
      "PhoneNumberUpdated",
    ]);
    return UserDirectory.fromEvents(events);
  },
});
