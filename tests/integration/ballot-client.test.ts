import { describe, expect, it } from 'vitest';
import { validateBallot, verifyIdentity } from '../../server/utils/ballot-client';

describe('ballot client form-data integration', () => {
  it('does not throw when constructing multipart form data for ballot validation', async () => {
    const result = await validateBallot(Buffer.from('%PDF-1.4 fake'), 'poll-1', 'token-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Ballot validation service unavailable');
  });

  it('does not throw when constructing multipart form data for identity verification', async () => {
    const result = await verifyIdentity(Buffer.from('%PDF-1.4 fake'));

    expect(result.success).toBe(false);
    expect(result.message).toBe('Ballot validation service unavailable');
  });
});
