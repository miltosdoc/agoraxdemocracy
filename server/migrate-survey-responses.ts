import { db } from "./db";
import { pollUserResponses, pollQuestions } from "@shared/schema";
import { eq, isNull } from "drizzle-orm";

/**
 * Migration script to normalize legacy multiple choice survey responses.
 * 
 * Problem: Multiple choice responses were sometimes stored with:
 * - answerId = NULL
 * - answerValue = [answerId1, answerId2, ...] as JSON array
 * 
 * Solution: Convert these to proper separate records with answerId set
 */

interface LegacyResponse {
  id: number;
  pollId: number;
  userId: number;
  questionId: number;
  answerId: number | null;
  answerValue: any;
}

export async function migrateSurveyResponses() {
  console.log("Starting survey response migration...");
  
  try {
    // Step 1: Find all responses with NULL answerId that might have JSON arrays
    // Use string pattern matching to avoid jsonb cast errors on non-JSON values
    const allNullAnswerIdResponses = await db
      .select()
      .from(pollUserResponses)
      .where(isNull(pollUserResponses.answerId)) as LegacyResponse[];
    
    // Filter to only those with JSON array pattern in answerValue
    const legacyResponses = allNullAnswerIdResponses.filter(r => {
      if (!r.answerValue) return false;
      const valueStr = typeof r.answerValue === 'string' ? r.answerValue : JSON.stringify(r.answerValue);
      return valueStr.startsWith('[') && valueStr.endsWith(']');
    });
    
    console.log(`Found ${legacyResponses.length} legacy responses to migrate (out of ${allNullAnswerIdResponses.length} total null answerId responses)`);
    
    if (legacyResponses.length === 0) {
      console.log("No legacy responses found. Migration complete.");
      return { migrated: 0, errors: 0, migratedIds: [] };
    }
    
    // Step 2: Process ALL responses in a SINGLE transaction for atomicity
    const result = await db.transaction(async (tx) => {
      let migratedCount = 0;
      const migratedIds: number[] = [];
      const skippedIds: number[] = [];
      
      for (const response of legacyResponses) {
        try {
          // Parse answerValue safely
          let answerIds: number[];
          try {
            answerIds = typeof response.answerValue === 'string' 
              ? JSON.parse(response.answerValue) 
              : response.answerValue;
          } catch (parseError) {
            console.log(`Skipping response ${response.id}: cannot parse answerValue as JSON`);
            skippedIds.push(response.id);
            continue;
          }
          
          // Only process if answerValue is an array of numbers
          if (!Array.isArray(answerIds) || answerIds.length === 0) {
            console.log(`Skipping response ${response.id}: answerValue is not a valid array`);
            skippedIds.push(response.id);
            continue;
          }
          
          // Get the question to verify it's multiple choice
          const [question] = await tx
            .select()
            .from(pollQuestions)
            .where(eq(pollQuestions.id, response.questionId))
            .limit(1);
          
          if (!question || question.questionType !== 'multipleChoice') {
            console.log(`Skipping response ${response.id}: not a multiple choice question`);
            skippedIds.push(response.id);
            continue;
          }
          
          console.log(`Migrating response ${response.id} with ${answerIds.length} answers`);
          
          // Create individual records for each answer ID
          for (const answerId of answerIds) {
            await tx
              .insert(pollUserResponses)
              .values({
                pollId: response.pollId,
                userId: response.userId,
                questionId: response.questionId,
                answerId: answerId,
                answerValue: null,
              });
          }
          
          // Delete the legacy record
          await tx
            .delete(pollUserResponses)
            .where(eq(pollUserResponses.id, response.id));
          
          migratedIds.push(response.id);
          migratedCount++;
          console.log(`✓ Successfully migrated response ${response.id}`);
        } catch (error) {
          console.error(`✗ Error migrating response ${response.id}:`, error);
          // Re-throw to rollback the entire transaction
          throw error;
        }
      }
      
      return { migratedCount, migratedIds, skippedIds };
    });
    
    console.log("\n=== Migration Summary ===");
    console.log(`Total legacy responses found: ${legacyResponses.length}`);
    console.log(`Successfully migrated: ${result.migratedCount}`);
    console.log(`Skipped (not eligible): ${result.skippedIds.length}`);
    console.log(`Migrated response IDs: ${result.migratedIds.join(', ') || 'none'}`);
    console.log(`Skipped response IDs: ${result.skippedIds.join(', ') || 'none'}`);
    
    return { 
      migrated: result.migratedCount, 
      errors: 0,
      migratedIds: result.migratedIds 
    };
  } catch (error) {
    console.error("Fatal error during migration (transaction rolled back):", error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateSurveyResponses()
    .then(() => {
      console.log("\nMigration completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nMigration failed:", error);
      process.exit(1);
    });
}
