/**
 * Ballot Router
 *
 * Handles ballot routes.
 */

import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { storage } from '../storage';
import { ballotUpload } from '../utils/ballot-client';
import { requireAuth } from '../auth';

export function registerBallotRoutes(app: Express): void {
  app.post("/api/ballot/token", requireAuth, async (req, res) => {
    try {
      const { pollId } = req.body;
      if (!pollId) {
        return res.status(400).json({ message: "Poll ID is required" });
      }
      // Verify poll exists and supports ballot voting
      const poll = await storage.getPoll(parseInt(pollId));
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }
      // Import ballot client
      const { generatePollToken } = await import('../utils/ballot-client');
      const token = generatePollToken();
      res.json({ token, pollId: String(pollId) });
    } catch (error) {
      console.error("Error generating ballot token:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία token" });
    }
  });
  app.get("/api/ballot/instructions", requireAuth, async (req, res) => {
    try {
      const { pollId, pollToken } = req.query;
      if (!pollId || !pollToken) {
        return res.status(400).json({ message: "Poll ID and token are required" });
      }
      const { getBallotInstructions } = await import('../utils/ballot-client');
      const instructions = await getBallotInstructions(
        String(pollId),
        String(pollToken)
      );
      if (!instructions) {
        return res.status(503).json({
          message: "Ballot service unavailable. Please try again later."
        });
      }
      res.json(instructions);
    } catch (error) {
      console.error("Error getting ballot instructions:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση οδηγιών" });
    }
  });
  app.post("/api/ballot/validate", requireAuth, multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }).single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      const { pollId, pollToken } = req.body;
      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
      }
      if (!pollId || !pollToken) {
        return res.status(400).json({ message: "Poll ID and token are required" });
      }
      // Verify poll exists
      const poll = await storage.getPoll(parseInt(pollId));
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }
      if (!poll.isActive) {
        return res.status(400).json({ message: "Η ψηφοφορία έχει ολοκληρωθεί" });
      }
      // Validate via Python ballot service
      const { validateBallot } = await import('../utils/ballot-client');
      const result = await validateBallot(
        file.buffer,
        String(pollId),
        String(pollToken),
      );
      if (result.success) {
        // Vote was recorded in Python service
        // Optionally sync to main DB for unified reporting
        return res.status(201).json({
          success: true,
          message: "Η ψήφος σας καταχωρήθηκε επιτυχώς μέσω Gov.gr",
          vote_choice: result.vote_choice,
          signer_name: result.signer_name,
        });
      } else {
        // Map rejection reasons to appropriate HTTP status
        const statusMap: Record<string, number> = {
          'invalid_signature': 403,
          'no_signature': 403,
          'unknown_signer': 403,
          'duplicate_file': 409,
          'already_voted': 409,
          'invalid_token': 400,
          'token_not_found': 400,
          'afm_not_found': 400,
          'vote_choice_not_found': 400,
          'pdf_read_error': 400,
        };
        const status = result.rejection_reason
          ? (statusMap[result.rejection_reason] || 400)
          : 400;
        return res.status(status).json({
          success: false,
          message: result.message,
          rejection_reason: result.rejection_reason,
        });
      }
    } catch (error) {
      console.error("Error validating ballot:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση της ψήφου" });
    }
  });
  app.get("/api/ballot/stats/:pollId", async (req, res) => {
    try {
      const pollId = req.params.pollId;
      const { getBallotStats } = await import('../utils/ballot-client');
      const stats = await getBallotStats(pollId);
      if (!stats) {
        return res.status(503).json({
          message: "Ballot service unavailable or no votes yet."
        });
      }
      res.json(stats);
    } catch (error) {
      console.error("Error getting ballot stats:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση στατιστικών" });
    }
  });
  app.get("/api/ballot/health", async (req, res) => {
    try {
      const { checkBallotServiceHealth } = await import('../utils/ballot-client');
      const isHealthy = await checkBallotServiceHealth();
      res.json({
        status: isHealthy ? 'healthy' : 'unavailable',
        service: 'ballot-validator'
      });
    } catch (error) {
      res.json({ status: 'unavailable', service: 'ballot-validator' });
    }
  });
}