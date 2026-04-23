/**
 * LLM Proposal Structuring Service
 * 
 * Uses an LLM to extract structured information from raw proposal text.
 * The LLM acts as a structurer/assistant only — it never auto-rejects proposals.
 * 
 * Extracts:
 * - Problem statement (what issue does this address?)
 * - Proposed solution (what action is being proposed?)
 * - Evidence/reasoning (what supports this proposal?)
 * - Category suggestion (which policy area does this fall under?)
 * - Quality score (how well-structured is the proposal?)
 * 
 * Quality thresholds (from PHASE2_RESEARCH.md):
 * - >90%: Auto-accept (well-structured, ready for deliberation)
 * - 20-90%: Send to sortition panel for review
 * - <20%: Return to author for revision
 * 
 * The LLM never makes a final decision — it only structures and scores.
 * Human review (via sortition panel) is always the final gate.
 */

import type { Proposal } from '@shared/schema';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface StructuredProposal {
  /** Clear problem statement extracted from the proposal */
  problem: string;
  
  /** Proposed solution/action extracted from the proposal */
  solution: string;
  
  /** Evidence, reasoning, or supporting arguments */
  evidence: string[];
  
  /** Suggested category (e.g., education, healthcare, infrastructure) */
  suggestedCategory: string;
  
  /** Quality score (0-100) based on structure, clarity, and completeness */
  qualityScore: number;
  
  /** Recommendations for improvement (if quality is low) */
  recommendations: string[];
  
  /** LLM's confidence in the extraction (0-1) */
  confidence: number;
}

export interface StructuringResult {
  structured: StructuredProposal;
  /** Recommended next state based on quality score */
  recommendedState: 'draft' | 'review' | 'deliberation';
  /** Whether the proposal should be auto-accepted, sent to sortition, or returned */
  recommendation: 'auto_accept' | 'sortition_review' | 'return_to_author';
}

// ─── LLM Integration ────────────────────────────────────────────────────────

/**
 * Structure a proposal using an LLM.
 * 
 * This function calls an external LLM API to extract structured information
 * from the proposal text. The LLM is configured to act as a structurer only —
 * it never rejects proposals, only extracts and scores.
 * 
 * @param question - The proposal's problem statement
 * @param solution - The proposal's proposed solution
 * @param llmProvider - The LLM provider to use (optional, defaults to configured provider)
 * 
 * @returns StructuredProposal with extracted information and quality score
 */
export async function structureProposal(
  question: string,
  solution: string,
  llmProvider?: string,
): Promise<StructuredProposal> {
  // TODO: Integrate with actual LLM API (OpenAI, Anthropic, local Ollama, etc.)
  // For now, return a mock structure for testing
  
  // In production, this would call:
  // const response = await llmClient.chat({
  //   model: llmProvider || process.env.LLM_PROVIDER,
  //   messages: [
  //     { role: 'system', content: SYSTEM_PROMPT },
  //     { role: 'user', content: `Question: ${question}\nSolution: ${solution}` }
  //   ],
  //   response_format: { type: 'json_object' }
  // });
  
  // Mock implementation for testing
  return {
    problem: extractProblem(question),
    solution: extractSolution(solution),
    evidence: extractEvidence(question, solution),
    suggestedCategory: suggestCategory(question, solution),
    qualityScore: calculateQualityScore(question, solution),
    recommendations: generateRecommendations(question, solution),
    confidence: 0.85,
  };
}

/**
 * System prompt for the LLM structuring service.
 * 
 * This prompt instructs the LLM to act as a structurer/assistant only.
 * It should never reject proposals — only extract, structure, and score.
 */
export const SYSTEM_PROMPT = `
You are a proposal structuring assistant for a deliberative democracy platform.
Your job is to extract structured information from raw proposal text.

IMPORTANT: You NEVER reject proposals. You only extract, structure, and score.
The final decision about whether a proposal proceeds is made by humans (sortition panel).

Extract the following from the proposal:
1. Problem: What issue does this proposal address? (1-2 sentences)
2. Solution: What action is being proposed? (1-2 sentences)
3. Evidence: What evidence or reasoning supports this proposal? (list of points)
4. Category: Which policy area does this fall under? (education, healthcare, infrastructure, environment, economy, governance, other)
5. Quality Score: How well-structured is this proposal? (0-100)
   - 90-100: Excellent — clear problem, specific solution, strong evidence
   - 70-89: Good — clear problem and solution, some evidence
   - 50-69: Fair — problem and solution present but vague
   - 30-49: Poor — unclear problem or solution
   - 0-29: Very Poor — barely structured, needs major revision
6. Recommendations: How can the author improve this proposal? (if quality < 70)

Return your response as JSON with the following structure:
{
  "problem": "string",
  "solution": "string",
  "evidence": ["string", "string"],
  "suggestedCategory": "string",
  "qualityScore": number,
  "recommendations": ["string"],
  "confidence": number
}
`;

// ─── Mock Implementations (for testing) ─────────────────────────────────────

function extractProblem(question: string): string {
  // In production, this would be LLM-extracted
  return question.length > 100 ? question.substring(0, 100) + '...' : question;
}

function extractSolution(solution: string): string {
  // In production, this would be LLM-extracted
  return solution.length > 100 ? solution.substring(0, 100) + '...' : solution;
}

function extractEvidence(question: string, solution: string): string[] {
  // In production, this would be LLM-extracted
  return [
    'Based on the problem statement and proposed solution',
    'Further evidence should be added by the author',
  ];
}

function suggestCategory(question: string, solution: string): string {
  // In production, this would be LLM-classified
  const lower = (question + ' ' + solution).toLowerCase();
  if (lower.includes('education') || lower.includes('school')) return 'education';
  if (lower.includes('health') || lower.includes('medical')) return 'healthcare';
  if (lower.includes('road') || lower.includes('building')) return 'infrastructure';
  if (lower.includes('environment') || lower.includes('pollution')) return 'environment';
  if (lower.includes('economy') || lower.includes('budget')) return 'economy';
  if (lower.includes('vote') || lower.includes('government')) return 'governance';
  return 'other';
}

function calculateQualityScore(question: string, solution: string): number {
  // In production, this would be LLM-scored
  let score = 50; // Base score
  
  // Longer, more detailed proposals tend to be better structured
  if (question.length > 50) score += 10;
  if (question.length > 100) score += 5;
  if (solution.length > 50) score += 10;
  if (solution.length > 100) score += 5;
  
  // Check for specific indicators of quality
  const lower = (question + ' ' + solution).toLowerCase();
  if (lower.includes('because')) score += 5;
  if (lower.includes('research') || lower.includes('study')) score += 5;
  if (lower.includes('data') || lower.includes('evidence')) score += 5;
  
  return Math.min(100, Math.max(0, score));
}

function generateRecommendations(question: string, solution: string): string[] {
  // In production, this would be LLM-generated
  const recommendations: string[] = [];
  
  if (question.length < 50) {
    recommendations.push('Provide more detail about the problem you\'re addressing');
  }
  if (solution.length < 50) {
    recommendations.push('Describe your proposed solution in more detail');
  }
  if (!((question + ' ' + solution).toLowerCase().includes('because'))) {
    recommendations.push('Explain why this solution addresses the problem');
  }
  if (!((question + ' ' + solution).toLowerCase().includes('evidence') || 
        (question + ' ' + solution).toLowerCase().includes('research'))) {
    recommendations.push('Add evidence or research to support your proposal');
  }
  
  return recommendations;
}

// ─── Recommendation Logic ───────────────────────────────────────────────────

/**
 * Determine the recommended next state and action based on quality score.
 * 
 * Thresholds:
 * - >90: Auto-accept (well-structured, ready for deliberation)
 * - 20-90: Send to sortition panel for review
 * - <20: Return to author for revision
 */
export function getRecommendation(qualityScore: number): {
  recommendedState: 'draft' | 'review' | 'deliberation';
  recommendation: 'auto_accept' | 'sortition_review' | 'return_to_author';
} {
  if (qualityScore > 90) {
    return {
      recommendedState: 'deliberation',
      recommendation: 'auto_accept',
    };
  } else if (qualityScore >= 20) {
    return {
      recommendedState: 'review',
      recommendation: 'sortition_review',
    };
  } else {
    return {
      recommendedState: 'draft',
      recommendation: 'return_to_author',
    };
  }
}

/**
 * Full structuring pipeline: structure + get recommendation.
 */
export async function structureAndRecommend(
  question: string,
  solution: string,
  llmProvider?: string,
): Promise<StructuringResult> {
  const structured = await structureProposal(question, solution, llmProvider);
  const recommendation = getRecommendation(structured.qualityScore);
  
  return {
    structured,
    ...recommendation,
  };
}
