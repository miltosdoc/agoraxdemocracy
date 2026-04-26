/**
 * LLM Validation Service for AgoraX Proposals
 *
 * Validates proposals using tiered scoring:
 * - <20%: Return to author for revision
 * - 20-90%: Trigger sortition body review
 * - >90%: Auto-approve
 *
 * Configurable via environment variables:
 * - LLM_API_KEY: API key for the LLM provider
 * - LLM_API_URL: Base URL (e.g., https://api.openai.com/v1 or http://localhost:11434/v1)
 * - LLM_MODEL: Model name (e.g., gpt-4o-mini, llama3.1:8b)
 */

import fetch from 'node-fetch';

// ─── Configuration ──────────────────────────────────────────────────────────

interface LLMConfig {
  apiKey: string;
  apiUrl: string;
  model: string;
}

function getConfig(): LLMConfig {
  return {
    apiKey: process.env.LLM_API_KEY || '',
    apiUrl: process.env.LLM_API_URL || 'https://api.openai.com/v1',
    model: process.env.LLM_MODEL || 'gpt-4o-mini',
  };
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LLMValidationResult {
  score: number;           // 0-100
  feedback: string;        // Explanation for the score
  category: 'return' | 'sortition' | 'auto_approve';
  details: {
    structure: number;      // 0-10: How well-structured is the proposal?
    specificity: number;    // 0-10: How specific and actionable?
    feasibility: number;    // 0-10: How feasible is the proposal?
    completeness: number;   // 0-10: Does it address all necessary aspects?
    clarity: number;        // 0-10: How clear is the language?
  };
}

// ─── Prompt Template ────────────────────────────────────────────────────────

function buildValidationPrompt(question: string, solution: string): string {
  return `Σε ρόλο εμπέρου αξιολόγησης πολιτικών προτάσεων, αξιολόγησε την παρακάτω πρόταση με βάση τα κριτήρια που ακολουθούν.

**Ερώτημα (Το Ερώτημα):** ${question}

**Λύση (Η Απάντηση):** ${solution}

**Κριτήρια Αξιολόγησης (0-10 το καθένα):**

1. **Δομή (Structure):** Η πρόταση έχει σαφή δομή με ερώτημα και λύση; Είναι λογικά οργανωμένη;
2. **Συγκεκριμενότητα (Specificity):** Η λύση είναι συγκεκριμένη και μετρήσιμη; Περιλαμβάνει χρονοδιάγραμμα, προϋπολογισμό, ή συγκεκριμένες ενέργειες;
3. **Εφικτότητα (Feasibility):** Η πρόταση είναι ρεαλιστική και εφικτή με τους διαθέσιμους πόρους;
4. **Πληρότητα (Completeness):** Η πρόταση καλύπτει όλα τα απαραίτητα στοιχεία (χρηματοδότηση, υλοποίηση, παρακολούθηση);
5. **Διαύγεια (Clarity):** Η γλώσσα είναι σαφής, ακριβής και κατανοητή;

**Αποτελέσματα:**

Παρέχε ΑΠΟΚΛΕΙΣΤΙΚΑ JSON με την παρακάτω μορφή:
{
  "score": <συνολικός βαθμός 0-100>,
  "feedback": "<λεπτομερής εξήγηση στα Ελληνικά>",
  "details": {
    "structure": <0-10>,
    "specificity": <0-10>,
    "feasibility": <0-10>,
    "completeness": <0-10>,
    "clarity": <0-10>
  }
}

**Κατώφλια:**
- <20%: Επιστροφή στον συγγραφέα για αναθεώρηση
- 20-90%: Αξιολόγηση από κληρωτό σώμα
- >90%: Αυτόματη έγκριση`;
}

// ─── LLM Client ─────────────────────────────────────────────────────────────

async function callLLM(prompt: string): Promise<string> {
  const config = getConfig();

  if (!config.apiKey) {
    console.warn('⚠️  LLM_API_KEY not set — returning mock validation result');
    return JSON.stringify({
      score: 75,
      feedback: 'Αυτή είναι μια δοκιμαστική απάντηση. Ρύθμισε το LLM_API_KEY για πραγματική αξιολόγηση.',
      details: {
        structure: 7,
        specificity: 7,
        feasibility: 8,
        completeness: 7,
        clarity: 8,
      },
    });
  }

  const isOllama = config.apiUrl.includes('11434') || config.apiUrl.includes('ollama');

  if (isOllama) {
    // Ollama API format
    const response = await fetch(`${config.apiUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: 'system', content: 'Είσαι ειδικός αξιολόγησης πολιτικών προτάσεων. Απάντησε ΜΟΝΟ με JSON.' },
          { role: 'user', content: prompt },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { message?: { content?: string } };
    return data.message?.content || JSON.stringify({ score: 50, feedback: 'Error parsing response', details: { structure: 5, specificity: 5, feasibility: 5, completeness: 5, clarity: 5 } });
  }

  // OpenAI-compatible API format
  const response = await fetch(`${config.apiUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: 'Είσαι ειδικός αξιολόγησης πολιτικών προτάσεων. Απάντησε ΜΟΝΟ με JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LLM API error: ${response.status} ${response.statusText} — ${errorBody}`);
  }

  const data = await response.json() as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error('LLM returned empty response');
  }

  return content;
}

// ─── Parse LLM Response ────────────────────────────────────────────────────

function parseLLMResponse(raw: string): LLMValidationResult {
  // Try to extract JSON from the response
  let jsonStr: string;

  // Try direct parse first
  try {
    jsonStr = raw.trim();
    JSON.parse(jsonStr); // Validate
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    } else {
      // Try to find { } in the text
      const braceMatch = raw.match(/\{[\s\S]*\}/);
      if (braceMatch) {
        jsonStr = braceMatch[0];
      } else {
        // Fallback: return a default result
        return {
          score: 50,
          feedback: 'Δεν μπόρεσε να αναλυθεί η απάντηση του LLM. Χρήση προεπιλεγμένης αξιολόγησης.',
          category: 'sortition',
          details: {
            structure: 5,
            specificity: 5,
            feasibility: 5,
            completeness: 5,
            clarity: 5,
          },
        };
      }
    }
  }

  let parsed: any;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    return {
      score: 50,
      feedback: 'Σφάλμα ανάλυσης JSON από το LLM. Χρήση προεπιλεγμένης αξιολόγησης.',
      category: 'sortition',
      details: {
        structure: 5,
        specificity: 5,
        feasibility: 5,
        completeness: 5,
        clarity: 5,
      },
    };
  }

  // Validate and normalize the parsed result
  const score = Math.max(0, Math.min(100, parsed.score ?? 50));
  const details = {
    structure: Math.max(0, Math.min(10, parsed.details?.structure ?? 5)),
    specificity: Math.max(0, Math.min(10, parsed.details?.specificity ?? 5)),
    feasibility: Math.max(0, Math.min(10, parsed.details?.feasibility ?? 5)),
    completeness: Math.max(0, Math.min(10, parsed.details?.completeness ?? 5)),
    clarity: Math.max(0, Math.min(10, parsed.details?.clarity ?? 5)),
  };

  // Determine category based on score thresholds
  let category: 'return' | 'sortition' | 'auto_approve';
  if (score < 20) {
    category = 'return';
  } else if (score > 90) {
    category = 'auto_approve';
  } else {
    category = 'sortition';
  }

  return {
    score,
    feedback: parsed.feedback || 'Δεν παρέχθηκε σχόλιο.',
    category,
    details,
  };
}

// ─── Main Validation Function ───────────────────────────────────────────────

/**
 * Validate a proposal using LLM.
 *
 * @param question - The proposal question (Το Ερώτημα)
 * @param solution - The proposed solution (Η Απάντηση)
 * @returns LLMValidationResult with score, feedback, and category
 */
export async function validateProposal(
  question: string,
  solution: string,
): Promise<LLMValidationResult> {
  const prompt = buildValidationPrompt(question, solution);
  const rawResponse = await callLLM(prompt);
  return parseLLMResponse(rawResponse);
}

// ─── Export for testing ─────────────────────────────────────────────────────

export { getConfig, callLLM, parseLLMResponse, buildValidationPrompt };