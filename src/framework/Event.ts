/**
 * Event types and utilities for event sourcing.
 *
 * @module Event
 */

import type * as Aggregate from "./Aggregate.js";

/**
 * Base event structure for domain events.
 *
 * @template Tag - Discriminator tag for the event type
 * @template Payload - Event-specific data
 */
export type Event<Tag extends string, Payload> = {
  readonly _tag: Tag;
  readonly aggregateId: Aggregate.AggregateId;
  readonly payload: Payload;
};

/**
 * Type alias for any event with unknown payload.
 */
export type AnyEvent = Event<string, unknown>;

/**
 * Function signature for applying an event to state.
 */
export type ApplyEvent<State, E extends AnyEvent> = {
  (self: State, event: E): State;
  (event: E): (self: State) => State;
};
