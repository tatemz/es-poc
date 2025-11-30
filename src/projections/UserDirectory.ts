/**
 * User directory projection.
 *
 * @module UserDirectory
 */

import { Array, Function, Match, Option, Record } from "effect";
import * as Aggregate from "../framework/Aggregate.js";
import * as User from "../domain/User.js";

/**
 * A directory entry for a user with a phone number.
 */
export type DirectoryEntry = {
  readonly id: Aggregate.AggregateId;
  readonly displayName: string;
  readonly phoneNumber: string;
};

/**
 * A user directory containing summary and entries for users with phone numbers.
 */
export type UserDirectory = {
  readonly totalUsers: number;
  readonly usersWithPhone: number;
  readonly entries: ReadonlyArray<DirectoryEntry>;
};

/**
 * Internal projection state for building the directory.
 */
type UserProjection = {
  readonly firstName: string;
  readonly lastName: string;
  readonly phoneNumber: Option.Option<string>;
};

/**
 * Internal record of user projections by aggregate id.
 */
type ProjectionRecord = Record.ReadonlyRecord<
  Aggregate.AggregateId,
  UserProjection
>;

/**
 * Applies a user event to the projection record.
 */
const applyEvent = (
  users: ProjectionRecord,
  event: User.UserEvent
): ProjectionRecord =>
  Match.valueTags(event, {
    UserCreated: ({ aggregateId, payload }) =>
      Record.set(users, aggregateId, {
        firstName: payload.firstName,
        lastName: payload.lastName,
        phoneNumber: Option.fromNullable(payload.phoneNumber),
      }),
    FirstNameUpdated: ({ aggregateId, payload }) =>
      Function.pipe(
        Record.get(users, aggregateId),
        Option.map((existing) =>
          Record.set(users, aggregateId, {
            ...existing,
            firstName: payload.firstName,
          })
        ),
        Option.getOrElse(() => users)
      ),
    PhoneNumberUpdated: ({ aggregateId, payload }) =>
      Function.pipe(
        Record.get(users, aggregateId),
        Option.map((existing) =>
          Record.set(users, aggregateId, {
            ...existing,
            phoneNumber: Option.some(payload.phoneNumber),
          })
        ),
        Option.getOrElse(() => users)
      ),
  });

/**
 * Converts projection record to directory.
 */
const toDirectory = (projections: ProjectionRecord): UserDirectory => {
  const allEntries = Record.toEntries(projections);
  const totalUsers = allEntries.length;

  const entries = Function.pipe(
    allEntries,
    Array.filterMap(([id, projection]) =>
      Function.pipe(
        projection.phoneNumber,
        Option.map(
          (phoneNumber): DirectoryEntry => ({
            id,
            displayName: `${projection.firstName} ${projection.lastName}`,
            phoneNumber,
          })
        )
      )
    )
  );

  return {
    totalUsers,
    usersWithPhone: entries.length,
    entries,
  };
};

/**
 * Builds a user directory from a sequence of user events.
 *
 * @param events - The user events to process
 * @returns A user directory with summary and entries for users with phone numbers
 */
export const fromEvents = (
  events: ReadonlyArray<User.UserEvent>
): UserDirectory => {
  const initial: ProjectionRecord = {};
  const projections = Array.reduce(events, initial, applyEvent);
  return toDirectory(projections);
};
