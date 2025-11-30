/**
 * User domain aggregate with event sourcing.
 *
 * @module User
 */

import { Array, Function, Match } from "effect"
import type { Aggregate, ApplyEvent } from "./Aggregate.js"
import { makeEventApplier, makeFactory } from "./Aggregate.js"
import type { AggregateId, Event } from "./Event.js"
import type { EventStore } from "./EventStore.js"

// ─── State ───────────────────────────────────────────────────────────────────

/**
 * The current state of a user.
 */
export type UserState = {
  readonly firstName: string
  readonly lastName: string
  readonly displayName: string
}

// ─── Events ──────────────────────────────────────────────────────────────────

/**
 * Event emitted when a new user is created.
 */
export type UserCreated = Event<"UserCreated", {
  readonly firstName: string
  readonly lastName: string
}>

/**
 * Event emitted when a user's first name is updated.
 */
export type FirstNameUpdated = Event<"FirstNameUpdated", {
  readonly firstName: string
}>

/**
 * Union of all user domain events.
 */
export type UserEvent = UserCreated | FirstNameUpdated

/**
 * All event tags for the user domain.
 */
export const EventTags = ["UserCreated", "FirstNameUpdated"] as const

// ─── Aggregate ───────────────────────────────────────────────────────────────

/**
 * User aggregate root type.
 */
export type UserAggregate = Aggregate<UserState, UserEvent>

/**
 * Creates an empty user aggregate with default state.
 */
export const empty = makeFactory<UserAggregate>({
  firstName: "",
  lastName: "",
  displayName: ""
})

/**
 * Applies a user event to update state.
 */
const applyEventToState: ApplyEvent<UserState, UserEvent> = Function.dual(
  2,
  (state: UserState, event: UserEvent) =>
    Match.valueTags(event, {
      UserCreated: ({ payload }): UserState => ({
        firstName: payload.firstName,
        lastName: payload.lastName,
        displayName: `${payload.firstName} ${payload.lastName}`
      }),
      FirstNameUpdated: ({ payload }): UserState => ({
        ...state,
        firstName: payload.firstName,
        displayName: `${payload.firstName} ${state.lastName}`
      })
    })
)

/**
 * Applies a user event to the aggregate.
 */
export const applyEvent = makeEventApplier<UserAggregate>(applyEventToState)

// ─── Operations ──────────────────────────────────────────────────────────────

/**
 * Loads a user aggregate by replaying its event history.
 *
 * @param aggregateId - The user's unique identifier
 * @param store - The event store containing user events
 * @returns The reconstituted user aggregate
 */
export const loadFromHistory = (
  aggregateId: AggregateId,
  store: EventStore<UserEvent>
): UserAggregate => {
  const events = store.loadEvents(aggregateId, EventTags)
  const initial = empty(aggregateId)
  return Array.reduce(events, initial, (agg, event) => applyEvent(agg, event, false))
}

/**
 * Creates a new user aggregate with the given name.
 *
 * @param aggregateId - The unique identifier for the new user
 * @param firstName - User's first name
 * @param lastName - User's last name
 * @returns A new user aggregate with an uncommitted UserCreated event
 */
export const create = (
  aggregateId: AggregateId,
  firstName: string,
  lastName: string
): UserAggregate => {
  const event: UserCreated = {
    _tag: "UserCreated",
    aggregateId,
    payload: { firstName, lastName }
  }
  return applyEvent(empty(aggregateId), event, true)
}

/**
 * Updates the first name of an existing user.
 *
 * @param aggregate - The user aggregate to update
 * @param firstName - The new first name
 * @returns The updated aggregate with an uncommitted FirstNameUpdated event
 */
export const updateFirstName = (
  aggregate: UserAggregate,
  firstName: string
): UserAggregate => {
  const event: FirstNameUpdated = {
    _tag: "FirstNameUpdated",
    aggregateId: aggregate.aggregateId,
    payload: { firstName }
  }
  return applyEvent(aggregate, event, true)
}
