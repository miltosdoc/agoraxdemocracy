# Contributing to AgoraX

Thank you for interested in contributing to AgoraX — a digital democracy platform for Greek communities.

## Before You Start

1. Read the [README.md](README.md) to understand the project vision and architecture
2. Read the [Demopolis specifications](~/.hermes/demopolis/Draft/docs/) for design context
3. Check existing issues and pull requests to avoid duplicate work

## Development Environment

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Python 3.10+ (for ballot service)
- npm or yarn

### Setup

```bash
# Clone and install
git clone https://github.com/miltosdoc/agoraxdemo.git
cd agoraxdemo
npm install

# Database setup
cp .env.example .env
# Edit .env — set DATABASE_URL

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

### Ballot Service (Optional)

The ballot service handles Gov.gr PDF signature verification:

```bash
cd ballot_service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

## Code Style

- **TypeScript**: Strict mode enabled. Run `npm run check` before committing
- **Formatting**: Follow existing patterns in the codebase
- **Greek text**: Use Greek for user-facing strings (i18n via `t()` helper)
- **English**: Use English for code comments, variable names, and documentation

## Schema Changes

When modifying the database schema:

1. Edit `shared/schema.ts`
2. Run `npx drizzle-kit generate` to create a migration
3. Review the generated SQL in `migrations/`
4. Test with `npm run db:push` against a development database
5. Commit both the schema changes and the migration file

**Important:** Always run `npm run check` after schema changes to verify TypeScript types.

## Adding New Routes

New API routes go in `server/routes.ts`. Follow the existing patterns:

```typescript
app.post("/api/resource", requireAuth, async (req, res) => {
  try {
    const parsed = insertResourceSchema.parse(req.body);
    const result = await storage.createResource(parsed);
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: formatValidationErrors(error.flatten()) });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});
```

## Adding New Frontend Pages

1. Create the page component in `client/src/pages/`
2. Add the route in `client/src/App.tsx`
3. Use TanStack Query for data fetching (`getQueryFn`, `apiRequest`)
4. Use the `t()` helper for Greek text
5. Wrap protected routes with `<ProtectedRoute>`

## Testing

Run the full test suite before submitting changes:

```bash
scripts/run_tests.sh
```

For specific tests:
```bash
scripts/run_tests.sh tests/path/to/test.py
```

## Pull Request Process

1. Create a feature branch from `main`
2. Make focused, atomic changes
3. Add tests for new functionality
4. Run `npm run check` and `scripts/run_tests.sh`
5. Update documentation if applicable
6. Submit the PR with a clear description

## Demopolis Specifications

The Demopolis working group maintains detailed design documents. When implementing new features, refer to:

- `~/.hermes/demopolis/Draft/docs/00_Πληρης_Τεκμηριωση.md` — Complete specification
- `~/.hermes/demopolis/Draft/docs/procedures/` — Procedure documents
- `~/.hermes/demopolis/Draft/docs/concepts/` — Concept documents

## Questions?

Contact the maintainers or open an issue for discussion.
