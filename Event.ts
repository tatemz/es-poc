/**
 * Event types and utilities for event sourcing.
 *
 * @module Event
 */

/**
 * Unique identifier for an aggregate root.
 */
export type AggregateId = string

/**
 * Base event structure for domain events.
 *
 * @template Tag - Discriminator tag for the event type
 * @template Payload - Event-specific data
 */
export type Event<Tag extends string, Payload> = {
  readonly _tag: Tag
  readonly aggregateId: AggregateId
  readonly payload: Payload
}

/**
 * Type alias for any event with unknown payload.
 */
export type AnyEvent = Event<string, unknown>
