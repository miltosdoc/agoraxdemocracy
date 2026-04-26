/**
 * Pure text-similarity helpers for amendment dedup.
 *
 * Lives in its own module so it can be imported from test files without
 * pulling in the database connection that `amendment-merger.ts` requires.
 */

export const DEFAULT_SIMILARITY_THRESHOLD = 0.7;

export function normalizeForSimilarity(text: string): string[] {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(token => token.length > 1);
}

export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;
  const setA = new Set(a);
  const setB = new Set(b);
  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection += 1;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface SimilarityCandidate {
  id: number;
  type: string;
  text: string;
}

export interface DuplicateGroup {
  representativeId: number;
  amendmentIds: number[];
  similarity: number;
  type: string;
}

/**
 * Group candidates whose normalized word sets exceed the threshold.
 * Only candidates of the same `type` are compared — an `improvement` and a
 * `counter_proposal` saying similar things are not redundant.
 */
export function groupDuplicates(
  candidates: SimilarityCandidate[],
  threshold: number = DEFAULT_SIMILARITY_THRESHOLD,
): DuplicateGroup[] {
  const tokenized = candidates.map(c => ({
    id: c.id,
    type: c.type,
    tokens: normalizeForSimilarity(c.text),
  }));

  const groupedById = new Set<number>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < tokenized.length; i += 1) {
    if (groupedById.has(tokenized[i].id)) continue;

    const group: DuplicateGroup = {
      representativeId: tokenized[i].id,
      amendmentIds: [tokenized[i].id],
      similarity: 1,
      type: tokenized[i].type,
    };

    let minSimilarity = 1;

    for (let j = i + 1; j < tokenized.length; j += 1) {
      if (groupedById.has(tokenized[j].id)) continue;
      if (tokenized[j].type !== tokenized[i].type) continue;

      const sim = jaccardSimilarity(tokenized[i].tokens, tokenized[j].tokens);
      if (sim >= threshold) {
        group.amendmentIds.push(tokenized[j].id);
        groupedById.add(tokenized[j].id);
        if (sim < minSimilarity) minSimilarity = sim;
      }
    }

    if (group.amendmentIds.length > 1) {
      group.similarity = minSimilarity;
      groupedById.add(group.representativeId);
      groups.push(group);
    }
  }

  return groups;
}
