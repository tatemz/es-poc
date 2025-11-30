# Event Sourcing POC

A proof of concept implementation of event sourcing patterns in TypeScript using the [Effect](https://effect.website/) library.

> ⚠️ **Note:** This is not meant to be a complete example, but rather a starting point for understanding event sourcing concepts.

## Inspiration

This project was inspired by:

- [SimpleCQRS (m-r)](https://github.com/gregoryyoung/m-r) - Greg Young's canonical CQRS example
- [CQRS Documents](http://cqrs.wordpress.com/wp-content/uploads/2010/11/cqrs_documents.pdf) - Foundational CQRS/ES documentation
- [CQRS FAQ](https://cqrs.nu/faq) - Common questions about CQRS and Event Sourcing

## Quick Start

```sh
pnpm install
pnpm start
```

## Core Concepts

- **Events** - Immutable records of state changes
- **Aggregates** - Domain entities ensuring consistency boundaries
- **Projections** - Read models built from event streams
- **Event Store** - Persistence layer for events
- **Event Replay** - Reconstructing state from history

## Project Structure

```
src/
├── framework/
│   ├── Event.ts       # Event type definitions
│   ├── Aggregate.ts   # Aggregate root patterns
│   └── EventStore.ts  # Event persistence
├── domain/
│   ├── User.ts        # User aggregate
│   └── UserRepository.ts
├── projections/
│   ├── UserDirectory.ts           # Directory projection
│   └── UserDirectoryRepository.ts
└── index.ts           # Demo application
```

## License

MIT
