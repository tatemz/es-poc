/**
 * Event store abstraction for persisting and loading events.
 *
 * @module EventStore
 */

import type { Types } from "effect";
import { Array, pipe } from "effect";
import * as Aggregate from "./Aggregate.js";
import * as Event from "./Event.js";

/**
 * Event store interface for loading and saving domain events.
 *
 * @template E - The event types stored in this store
 */
export type EventStore<E extends Event.AnyEvent> = {
  /**
   * Loads all events filtered by event tags.
   */
  readonly loadEvents: <Tag extends Types.Tags<E>>(
    tags: ReadonlyArray<Tag>
  ) => ReadonlyArray<Types.ExtractTag<E, Tag>>;

  /**
   * Loads events for a specific aggregate filtered by event tags.
   */
  readonly loadEventsForAggregate: <Tag extends Types.Tags<E>>(
    aggregateId: Aggregate.AggregateId,
    tags: ReadonlyArray<Tag>
  ) => ReadonlyArray<Types.ExtractTag<E, Tag>>;

  /**
   * Persists new events for an aggregate.
   */
  readonly saveEvents: (
    aggregateId: Aggregate.AggregateId,
    events: ReadonlyArray<E>
  ) => void;
};

/**
 * Creates an in-memory event store for development and testing.
 *
 * @param initialEvents - Optional seed events for the store
 * @returns An EventStore backed by in-memory storage
 */
export const makeInMemory = <E extends Event.AnyEvent>(
  initialEvents: ReadonlyArray<E> = []
): EventStore<E> => {
  let storedEvents: ReadonlyArray<E> = initialEvents;

  const hasMatchingTag =
    <Tag extends Types.Tags<E>>(tags: ReadonlyArray<Tag>) =>
    (e: E): e is Types.ExtractTag<E, Tag> =>
      Array.contains(tags, e._tag as Tag);

  return {
    loadEvents: <Tag extends Types.Tags<E>>(tags: ReadonlyArray<Tag>) =>
      Array.filter(storedEvents, hasMatchingTag(tags)),

    loadEventsForAggregate: <Tag extends Types.Tags<E>>(
      aggregateId: Aggregate.AggregateId,
      tags: ReadonlyArray<Tag>
    ) =>
      pipe(
        storedEvents,
        Array.filter((e) => e.aggregateId === aggregateId),
        Array.filter(hasMatchingTag(tags))
      ),

    saveEvents: (
      _aggregateId: Aggregate.AggregateId,
      events: ReadonlyArray<E>
    ) => {
      storedEvents = Array.appendAll(storedEvents, events);
    },
  };
};

/**
 * Commits an aggregate's uncommitted changes to the event store.
 *
 * @param aggregate - The aggregate with uncommitted changes
 * @param store - The event store to persist to
 * @returns The aggregate with all changes marked as committed
 */
export const commit = <State, E extends Event.AnyEvent>(
  aggregate: Aggregate.Aggregate<State, E>,
  store: EventStore<E>
): Aggregate.Aggregate<State, E> => {
  store.saveEvents(aggregate.aggregateId, aggregate.uncommittedChanges);
  return Aggregate.markChangesAsCommitted(aggregate);
};
