/**
 * Storage Layer - Domain-Driven Architecture
 *
 * This file re-exports the domain repositories and legacy facade.
 * New code should import domain repositories directly:
 *   import { UserRepository } from './storage/users';
 *
 * Legacy code can continue using the facade:
 *   import { DatabaseStorage } from './storage';
 */

// Domain repositories (preferred for new code)
export { UserRepository } from './storage/users';
export { CommunityRepository } from './storage/communities';
export { ProposalRepository } from './storage/proposals';
export { AmendmentRepository } from './storage/amendments';
export { SortitionRepository } from './storage/sortition';
export { VotingRepository } from './storage/voting';
export { DebateRepository } from './storage/debate';
export { NotificationRepository } from './storage/notifications';
export { PlatformRepository } from './storage/platform';

// Legacy facade (backward compatibility)
export { DatabaseStorage } from './storage/legacy';
export type { IStorage } from './storage/types';

// Re-export schema types for convenience
export type * from '../../shared/schema';



// Legacy storage instance for backward compatibility
import { DatabaseStorage } from "./storage/legacy";
export const storage = new DatabaseStorage();
