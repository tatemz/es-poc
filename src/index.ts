/**
 * Event Sourcing POC - Demonstrates basic event sourcing patterns.
 *
 * @module index
 */

import { Function } from "effect";
import * as EventStore from "./framework/EventStore.js";
import * as User from "./domain/User.js";
import * as UserDirectory from "./projections/UserDirectory.js";
import * as UserDirectoryRepository from "./projections/UserDirectoryRepository.js";
import * as UserRepository from "./domain/UserRepository.js";

const logDirectory = (directory: UserDirectory.UserDirectory) => {
  console.log(`  Total users: ${directory.totalUsers}`);
  console.log(`  Users with phone: ${directory.usersWithPhone}`);
  if (directory.entries.length === 0) {
    console.log("  Entries: (none)");
    return;
  }
  console.log("  Entries:");
  directory.entries.forEach((entry) => {
    console.log(`    - ${entry.displayName} (${entry.phoneNumber})`);
  });
};

/**
 * Demonstrates the event sourcing workflow:
 * 1. Create users (some with phone numbers, some without)
 * 2. Show directory (only users with phone numbers)
 * 3. Update a user to add phone number
 * 4. Show updated directory
 */
export const main = () => {
  const store = EventStore.makeInMemory<User.UserEvent>();
  const userRepository = UserRepository.make(store);
  const userDirectoryRepository = UserDirectoryRepository.make(store);

  console.log("=== Creating users ===");
  console.log("Creating Robert Smith (no phone)...");
  Function.pipe(
    User.create("user-001", "Robert", "Smith"),
    userRepository.save
  );

  console.log("Creating Alice Smith (with phone 555-5678)...");
  Function.pipe(
    User.create("user-002", "Alice", "Smith", "555-5678"),
    userRepository.save
  );

  console.log("\n=== User Directory (users with phone numbers) ===");
  logDirectory(userDirectoryRepository.load());

  console.log("\n=== Updating Robert ===");
  console.log("Changing name to Bob and adding phone 555-1234...");
  Function.pipe(
    userRepository.getById("user-001"),
    User.updateFirstName("Bob"),
    User.updatePhoneNumber("555-1234"),
    userRepository.save
  );

  console.log("\n=== User Directory (after update) ===");
  logDirectory(userDirectoryRepository.load());
};

main();
