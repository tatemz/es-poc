/**
 * User domain aggregate with event sourcing.
 *
 * @module User
 */

import { Array, Function, Match, Option } from "effect";
import * as Aggregate from "../framework/Aggregate.js";
import * as Event from "../framework/Event.js";

/**
 * The current state of a user.
 */
export type UserState = {
  readonly firstName: string;
  readonly lastName: string;
  readonly displayName: string;
  readonly phoneNumber: Option.Option<string>;
};

/**
 * Event emitted when a new user is created.
 */
export type UserCreated = Event.Event<
  "UserCreated",
  {
    readonly firstName: string;
    readonly lastName: string;
    readonly phoneNumber?: string;
  }
>;

/**
 * Event emitted when a user's first name is updated.
 */
export type FirstNameUpdated = Event.Event<
  "FirstNameUpdated",
  {
    readonly firstName: string;
  }
>;

/**
 * Event emitted when a phone number is updated for a user.
 */
export type PhoneNumberUpdated = Event.Event<
  "PhoneNumberUpdated",
  {
    readonly phoneNumber: string;
  }
>;

/**
 * Union of all user domain events.
 */
export type UserEvent = UserCreated | FirstNameUpdated | PhoneNumberUpdated;

/**
 * All event tags for the user domain.
 */
export const EventTags = [
  "UserCreated",
  "FirstNameUpdated",
  "PhoneNumberUpdated",
] as const;

/**
 * User aggregate root type.
 */
export type UserAggregate = Aggregate.Aggregate<UserState, UserEvent>;

/**
 * Creates an empty user aggregate with default state.
 */
export const empty = Aggregate.makeFactory<UserState, UserEvent>({
  firstName: "",
  lastName: "",
  displayName: "",
  phoneNumber: Option.none(),
});

/**
 * Applies a user event to update state.
 */
const applyEventToState: Event.ApplyEvent<UserState, UserEvent> = Function.dual(
  2,
  (state: UserState, event: UserEvent) =>
    Match.valueTags(event, {
      UserCreated: ({ payload }): UserState => ({
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName: `${payload.firstName} ${payload.lastName}`,
        phoneNumber: Option.fromNullable(payload.phoneNumber),
      }),
      FirstNameUpdated: ({ payload }): UserState => ({
        ...state,
        firstName: payload.firstName,
        displayName: `${payload.firstName} ${state.lastName}`,
      }),
      PhoneNumberUpdated: ({ payload }): UserState => ({
        ...state,
        phoneNumber: Option.some(payload.phoneNumber),
      }),
    })
);

/**
 * Applies a user event to the aggregate.
 */
export const applyEvent = Aggregate.makeEventApplier<UserState, UserEvent>(
  applyEventToState
);

/**
 * Loads a user aggregate by replaying its event history.
 *
 * @param aggregateId - The user's unique identifier
 * @param store - The event store containing user events
 * @returns The reconstituted user aggregate
 */
export const loadFromHistory = (
  aggregateId: Aggregate.AggregateId,
  events: ReadonlyArray<UserEvent>
): UserAggregate => {
  const initial = empty(aggregateId);
  return Array.reduce(events, initial, (agg, event) =>
    applyEvent(agg, event, false)
  );
};

/**
 * Creates a new user aggregate with the given name.
 *
 * @param aggregateId - The unique identifier for the new user
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A new user aggregate with an uncommitted UserCreated event
 */
export const create = (
  aggregateId: Aggregate.AggregateId,
  firstName: string,
  lastName: string,
  phoneNumber?: string
): UserAggregate => {
  const event: UserCreated = {
    _tag: "UserCreated",
    aggregateId,
    payload: phoneNumber
      ? { firstName, lastName, phoneNumber }
      : { firstName, lastName },
  };
  return applyEvent(empty(aggregateId), event, true);
};

/**
 * Updates the first name of an existing user.
 *
 * @param aggregate - The user aggregate to update
 * @param firstName - The new first name
 * @returns The updated aggregate with an uncommitted FirstNameUpdated event
 */
export const updateFirstName: {
  (aggregate: UserAggregate, firstName: string): UserAggregate;
  (firstName: string): (aggregate: UserAggregate) => UserAggregate;
} = Function.dual(2, (aggregate, firstName) => {
  const event: FirstNameUpdated = {
    _tag: "FirstNameUpdated",
    aggregateId: aggregate.aggregateId,
    payload: { firstName },
  };
  return applyEvent(aggregate, event, true);
});

/**
 * Updates a phone number of an existing user.
 *
 * @param aggregate - The user aggregate to update
 * @param phoneNumber - The phone number to update
 * @returns The updated aggregate with an uncommitted PhoneNumberUpdated event
 */
export const updatePhoneNumber: {
  (aggregate: UserAggregate, phoneNumber: string): UserAggregate;
  (phoneNumber: string): (aggregate: UserAggregate) => UserAggregate;
} = Function.dual(2, (aggregate, phoneNumber) => {
  const event: PhoneNumberUpdated = {
    _tag: "PhoneNumberUpdated",
    aggregateId: aggregate.aggregateId,
    payload: { phoneNumber },
  };
  return applyEvent(aggregate, event, true);
});
