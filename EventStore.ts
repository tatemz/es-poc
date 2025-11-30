/**
 * Event store abstraction for persisting and loading events.
 *
 * @module EventStore
 */

import type { Types } from "effect"
import { Array, Option, Record } from "effect"
import type { Aggregate } from "./Aggregate.js"
import { markChangesAsCommitted } from "./Aggregate.js"
import type { AggregateId, AnyEvent } from "./Event.js"

/**
 * Event store interface for loading and saving domain events.
 *
 * @template E - The event types stored in this store
 */
export type EventStore<E extends AnyEvent> = {
  /**
   * Loads events for a specific aggregate filtered by event tags.
   */
  readonly loadEvents: <Tag extends Types.Tags<E>>(
    aggregateId: AggregateId,
    tags: ReadonlyArray<Tag>
  ) => ReadonlyArray<Types.ExtractTag<E, Tag>>

  /**
   * Persists new events for an aggregate.
   */
  readonly saveEvents: (aggregateId: AggregateId, events: ReadonlyArray<E>) => void
}

/**
 * Creates an in-memory event store for development and testing.
 *
 * @param initialEvents - Optional seed events for the store
 * @returns An EventStore backed by in-memory storage
 */
export const makeInMemory = <E extends AnyEvent>(initialEvents: ReadonlyArray<E> = []): EventStore<E> => {
  let eventsByAggregate: Record.ReadonlyRecord<AggregateId, ReadonlyArray<E>> = Array.groupBy(
    initialEvents,
    (e) => e.aggregateId
  )

  return {
    loadEvents: <Tag extends Types.Tags<E>>(aggregateId: AggregateId, tags: ReadonlyArray<Tag>) => {
      const hasMatchingTag = (e: E): e is Types.ExtractTag<E, Tag> => Array.contains(tags, e._tag as Tag)

      return Record.get(eventsByAggregate, aggregateId).pipe(
        Option.map(Array.filter(hasMatchingTag)),
        Option.getOrElse(Array.empty)
      )
    },
    saveEvents: (aggregateId: AggregateId, events: ReadonlyArray<E>) => {
      const existingEvents = Record.get(eventsByAggregate, aggregateId).pipe(
        Option.getOrElse(Array.empty)
      )
      const updatedEvents = Array.appendAll(existingEvents, events)
      eventsByAggregate = Record.set(eventsByAggregate, aggregateId, updatedEvents)
    }
  }
}

/**
 * Commits an aggregate's uncommitted changes to the event store.
 *
 * @param aggregate - The aggregate with uncommitted changes
 * @param store - The event store to persist to
 * @returns The aggregate with all changes marked as committed
 */
export const commit = <State, E extends AnyEvent>(
  aggregate: Aggregate<State, E>,
  store: EventStore<E>
): Aggregate<State, E> => {
  store.saveEvents(aggregate.aggregateId, aggregate.uncommittedChanges)
  return markChangesAsCommitted(aggregate)
}
