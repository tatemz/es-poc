/**
 * Aggregate root types and operations for event sourcing.
 *
 * @module Aggregate
 */

import { Array, Function, Number } from "effect"
import type { AggregateId, AnyEvent } from "./Event.js"

/**
 * An aggregate root that maintains state through events.
 *
 * @template State - The current state of the aggregate
 * @template E - The event types this aggregate handles
 */
export type Aggregate<State, E extends AnyEvent> = {
  readonly aggregateId: AggregateId
  readonly state: State
  readonly committedChanges: ReadonlyArray<E>
  readonly uncommittedChanges: ReadonlyArray<E>
  readonly version: number
}

/**
 * Type alias for any aggregate with unknown state and events.
 */
export type AnyAggregate = Aggregate<any, AnyEvent>

/**
 * Extracts the state type from an aggregate.
 */
export type StateOf<A extends AnyAggregate> = A extends Aggregate<infer State, AnyEvent> ? State : never

/**
 * Extracts the event type from an aggregate.
 */
export type EventOf<A extends AnyAggregate> = A extends Aggregate<any, infer E> ? E : never

/**
 * Function signature for applying an event to state.
 */
export type ApplyEvent<State, E extends AnyEvent> = {
  (self: State, event: E): State
  (event: E): (self: State) => State
}

/**
 * Function signature for applying an event to an aggregate.
 */
export type ApplyEventToAggregate<A extends AnyAggregate> = {
  (self: A, event: EventOf<A>, isNew: boolean): A
  (event: EventOf<A>, isNew: boolean): (self: A) => A
}

/**
 * Creates a factory function for initializing new aggregates with default state.
 *
 * @param state - The initial state for new aggregates
 * @returns A function that creates aggregates with the given id
 */
export const makeFactory =
  <State, E extends AnyEvent>(state: State) => (aggregateId: AggregateId): Aggregate<State, E> => ({
    aggregateId,
    state,
    committedChanges: Array.empty(),
    uncommittedChanges: Array.empty(),
    version: 0
  })

/**
 * Marks all uncommitted changes as committed.
 *
 * @param aggregate - The aggregate to update
 * @returns A new aggregate with changes marked as committed
 */
export const markChangesAsCommitted = <A extends AnyAggregate>(aggregate: A): A => ({
  ...aggregate,
  committedChanges: Array.appendAll(aggregate.committedChanges, aggregate.uncommittedChanges),
  uncommittedChanges: Array.empty()
})

/**
 * Creates an event applier function for an aggregate type.
 *
 * @param applyEventToState - Function that applies an event to the state
 * @returns A dual function for applying events to aggregates
 */
export const makeEventApplier = <State, E extends AnyEvent>(
  applyEventToState: ApplyEvent<State, E>
): ApplyEventToAggregate<Aggregate<State, E>> =>
  Function.dual(3, (aggregate: Aggregate<State, E>, event: E, isNew: boolean): Aggregate<State, E> => ({
    ...aggregate,
    state: applyEventToState(aggregate.state, event),
    committedChanges: isNew ? aggregate.committedChanges : Array.append(aggregate.committedChanges, event),
    uncommittedChanges: isNew ? Array.append(aggregate.uncommittedChanges, event) : aggregate.uncommittedChanges,
    version: Number.increment(aggregate.version)
  }))
