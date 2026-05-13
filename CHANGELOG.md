# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive E2E test suite with Playwright (7 test files)
- Load testing script (`scripts/load-test.js`)
- Security audit checklist (`docs/SECURITY_AUDIT.md`)
- Performance optimization guide (`docs/PERFORMANCE_OPTIMIZATION.md`)
- Migration strategy documentation (`docs/MIGRATION_STRATEGY.md`)
- Contributing guide (`CONTRIBUTING.md`)

### Changed
- Migrated all 13 routers from legacy `DatabaseStorage` facade to domain-specific repositories
- Created pre-instantiated repository instances (`userRepo`, `communityRepo`, etc.)
- Updated README with comprehensive documentation and architecture diagrams

### Fixed
- Fixed variable shadowing conflicts between repo instances and Drizzle schema tables
- Fixed `getAttendanceSummary()` return type in SortitionRepository
- Fixed `upsertAttendance()` parameter format in proposals router

### Removed
- Removed 106 `console.log` statements from production code
- Removed legacy `DatabaseStorage` facade usage from all routers

## [0.1.0] - 2026-05-12

### Added
- Initial release with core deliberative democracy features
- 8-state proposal lifecycle (Draft → Review → Synthesis → Author Review → Sortition → Voting → Archived)
- Cryptographically secure sortition with CSPRNG and rejection sampling
- TF-IDF + cosine similarity amendment clustering
- Democracy score calculation with composite metrics
- Domain-driven architecture with 9 repositories and 12 routers
- Comprehensive test suite (81 tests, 100% passing)
- Docker multi-stage build configuration
- CI/CD pipeline with GitHub Actions
- Health check endpoint with real-time memory metrics
- Rate limiting middleware
- Structured logging module
- E2E test infrastructure with Playwright
- Performance benchmarking script
- Load testing script
- Security audit checklist
- Migration strategy documentation
- Contributing guide

### Changed
- Split monolithic `storage.ts` (3,135 lines) into 9 domain repositories
- Split monolithic `routes.ts` (2,412 lines) into 12 domain routers
- Reduced `routes.ts` from 2,412 to 67 lines (97% reduction)
- Reduced total storage lines by 42%
- Enforced module boundaries with automated script
- Added JSDoc to all public APIs
- Eliminated all `any` type usages
- Removed all `console.log` statements from production code

### Fixed
- Fixed variable shadowing conflicts between repo instances and schema tables
- Fixed `getAttendanceSummary()` return type in SortitionRepository
- Fixed `upsertAttendance()` parameter format in proposals router
- Fixed TypeScript compilation errors (0 errors remaining)

### Security
- Implemented CSPRNG-backed Fisher-Yates shuffle with rejection sampling
- Added rate limiting middleware (100 req/15min API, 10 req/15min auth, 5 req/min voting)
- Added structured logging for security events
- Added health check endpoint for monitoring
- Added security audit checklist

### Performance
- Added request timing middleware for slow request detection
- Added performance benchmarking script
- Added load testing script
- Added performance optimization guide

## [0.0.1] - 2026-04-01

### Added
- Initial prototype with basic proposal lifecycle
- Basic sortition implementation
- Amendment similarity algorithm
- Democracy score calculation
- Local Docker Compose setup
- Basic test suite

### Changed
- Initial architecture design
- Basic domain-driven structure

### Fixed
- Initial bug fixes and improvements

[Unreleased]: https://github.com/miltosdoc/agoraxdemo/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/miltosdoc/agoraxdemo/compare/v0.0.1...v0.1.0
[0.0.1]: https://github.com/miltosdoc/agoraxdemo/releases/tag/v0.0.1
