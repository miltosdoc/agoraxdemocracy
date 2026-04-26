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

// ─── LLM Tiered Validation ──────────────────────────────────────────────────

/**
 * Result of LLM-based proposal validation.
 */
export interface ValidationResult {
  /** Quality score 0-100 */
  score: number;
  /** Human-readable feedback explaining the score */
  feedback: string;
  /** Flags raised during validation (e.g., 'abusive_content', 'unclear') */
  flags: string[];
  /** Recommended disposition based on score tiers */
  disposition: 'returned' | 'sortition_review' | 'auto_approved';
}

/**
 * Greek-language validation prompt.
 * Evaluates: relevance, absence of abusive content, clarity/coherence, defines specific action.
 */
const VALIDATION_PROMPT = `
Είσαι ένας βοηθός αξιολόγησης προτάσεων για μια πλατφόρμα διαβουλευτικής δημοκρατίας.
Το έργο σου είναι να αξιολογήσεις την ποιότητα μιας πρότασης βάσει των παρακάτω κριτηρίων:

1. ΣΧΕΤΙΚΟΤΗΤΑ: Η πρόταση αφορά ένα συγκεκριμένο ζήτημα κοινού ενδιαφέροντος;
2. ΑΠΟΥΣΙΑ ΕΠΙΘΕΤΙΚΟΥ ΠΕΡΙΕΧΟΜΕΝΟΥ: Δεν περιέχει επιθετικό, προσβλητικό ή διακρίνον περιεχόμενο;
3. ΣΑΦΕΙΑ/ΣΥΝΕΠΕΙΑ: Το κείμενο είναι σαφές, συνεπές και καλά δομημένο;
4. ΣΥΓΚΕΚΡΙΜΕΝΗ ΕΝΕΡΓΕΙΑ: Ορίζει μια συγκεκριμένη, εφικτή ενέργεια ή λύση;

Αξιολόγησε την πρόταση και επισήμανε τυχόν προβλήματα.
Επιστρέψε το αποτέλεσμα σε μορφή JSON:
{
  "score": αριθμός 0-100,
  "feedback": "συνοπτική εξήγηση της αξιολόγησης στα Ελληνικά",
  "flags": ["λίστα προβλημάτων αν υπάρχουν, αλλιώς κενή"]
}

Κλίμακα βαθμολογίας:
- 90-100: Άριστη πρόταση, έτοιμη για αυτόματη έγκριση
- 20-89: Καλή πρόταση, χρειάζεται κληρωτή επιθεώρηση
- 0-19: Ανεπαρκής πρόταση, επιστροφή στον συγγραφέα

Πρόταση:
Ερώτημα: {question}
Λύση: {solution}
`;

/**
 * Call an LLM backend and parse the JSON response.
 *
 * @param prompt - The prompt to send
 * @param backend - 'ollama' (default) or 'openrouter'
 */
async function callLLM(prompt: string, backend: 'ollama' | 'openrouter' = 'ollama'): Promise<{ score: number; feedback: string; flags: string[] } | null> {
  try {
    if (backend === 'ollama') {
      return await callOllama(prompt);
    } else {
      return await callOpenRouter(prompt);
    }
  } catch {
    return null;
  }
}

/**
 * Call Ollama local LLM backend.
 */
async function callOllama(prompt: string): Promise<{ score: number; feedback: string; flags: string[] }> {
  const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  const model = process.env.OLLAMA_MODEL || 'llama3';

  const response = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      prompt,
      stream: false,
      options: { temperature: 0.1 },
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.response || '';
  return parseValidationResponse(text);
}

/**
 * Call OpenRouter LLM backend.
 */
async function callOpenRouter(prompt: string): Promise<{ score: number; feedback: string; flags: string[] }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY not configured');
  }

  const model = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3-8b-instruct';
  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: 'You are a proposal validation assistant. Return only valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseValidationResponse(text);
}

/**
 * Parse the LLM response text into a structured validation result.
 * Extracts JSON from the response, handling potential markdown wrapping.
 */
function parseValidationResponse(text: string): { score: number; feedback: string; flags: string[] } {
  // Strip markdown code block wrappers if present
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    cleaned = jsonMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(cleaned);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 50)),
      feedback: typeof parsed.feedback === 'string' ? parsed.feedback : 'No feedback provided',
      flags: Array.isArray(parsed.flags) ? parsed.flags : [],
    };
  } catch {
    // If JSON parsing fails, return a safe default
    return { score: 50, feedback: 'Could not parse LLM response', flags: ['parse_error'] };
  }
}

/**
 * Validate a proposal using an LLM.
 *
 * Evaluates the proposal on four criteria (in Greek):
 * - Relevance to community concerns
 * - Absence of abusive content
 * - Clarity and coherence
 * - Defines a specific, actionable solution
 *
 * Scoring tiers:
 * - <20%  → returned (needs major revision)
 * - 20-90% → sortition review (human panel evaluates)
 * - >90%  → auto-approved (ready for deliberation)
 *
 * @param question - The proposal's problem statement
 * @param solution - The proposal's proposed solution
 * @param backend - LLM backend: 'ollama' (default) or 'openrouter'
 * @returns ValidationResult with score, feedback, flags, and disposition
 */
export async function validateProposal(
  question: string,
  solution: string,
  backend: 'ollama' | 'openrouter' = 'ollama',
): Promise<ValidationResult> {
  const prompt = VALIDATION_PROMPT
    .replace('{question}', question)
    .replace('{solution}', solution);

  const result = await callLLM(prompt, backend);

  if (!result) {
    // No LLM available — return fallback
    return {
      score: 50,
      feedback: 'LLM unavailable — manual review required',
      flags: ['llm_unavailable'],
      disposition: 'sortition_review',
    };
  }

  const disposition = result.score > 90
    ? 'auto_approved'
    : result.score >= 20
      ? 'sortition_review'
      : 'returned';

  return {
    score: result.score,
    feedback: result.feedback,
    flags: result.flags,
    disposition,
  };
}
