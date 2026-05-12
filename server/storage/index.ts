/**
 * Storage Layer
 *
 * Domain-specific repositories for all database operations.
 * Each repository handles a specific domain of the application.
 *
 * Legacy facade (DatabaseStorage) is available in legacy.ts for backward compatibility.
 */

// Domain repositories
export { UserRepository } from './users';
export { CommunityRepository } from './communities';
export { ProposalRepository } from './proposals';
export { AmendmentRepository } from './amendments';
export { SortitionRepository } from './sortition';
export { VotingRepository } from './voting';
export { DebateRepository } from './debate';
export { NotificationRepository } from './notifications';
export { PlatformRepository } from './platform';

// Legacy facade for backward compatibility
export { DatabaseStorage } from './legacy';
export type { IStorage } from './types';

