/**
 * Event Sourcing POC - Demonstrates basic event sourcing patterns.
 *
 * @module index
 */

import * as EventStore from "./EventStore.js"
import * as User from "./User.js"

/**
 * Demonstrates the event sourcing workflow:
 * 1. Create a new user aggregate
 * 2. Commit the creation event to the store
 * 3. Load the user from history
 * 4. Update the user's first name
 * 5. Commit the update event
 */
export const main = () => {
  const userId = "user-001"
  const store = EventStore.makeInMemory<User.UserEvent>()

  // Create a new user
  const newUser = User.create(userId, "Robert", "Smith")
  console.log("Created user:", newUser)

  // Commit creation to store
  const committedUser = EventStore.commit(newUser, store)
  console.log("Committed user:", committedUser)

  // Load user from event history
  const loadedUser = User.loadFromHistory(userId, store)
  console.log("Loaded user:", loadedUser)

  // Update first name
  const updatedUser = User.updateFirstName(loadedUser, "Bob")
  console.log("Updated user:", updatedUser)

  // Commit update to store
  const finalUser = EventStore.commit(updatedUser, store)
  console.log("Final state:", finalUser)
}

main()
