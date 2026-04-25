/**
 * Storage amendment contract tests.
 *
 * Amendment review and community signal routes need to fetch a single
 * amendment by id. This protects the storage interface from drifting away from
 * the routes.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const storagePath = resolve(process.cwd(), 'server/storage.ts');
const storageSource = readFileSync(storagePath, 'utf8');

describe('storage amendment contract', () => {
  it('exposes getAmendment in IStorage', () => {
    expect(storageSource).toMatch(/getAmendment\(id: number\): Promise<ProposalAmendment \| undefined>;/);
  });

  it('implements getAmendment in DatabaseStorage', () => {
    expect(storageSource).toMatch(/async getAmendment\(id: number\): Promise<ProposalAmendment \| undefined> \{/);
    expect(storageSource).toMatch(/\.from\(proposalAmendments\)\.where\(eq\(proposalAmendments\.id, id\)\)/);
  });
});
