import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { updatePollLocations } from "./update-poll-locations";
import {
  createPollSchema,
  createSurveyPollSchema,
  insertVoteSchema,
  rankingVoteSchema,
  insertCommentSchema,
  votes,
  sortitionMembers,
  sortitionBodies,
  castProposalVoteSchema,
} from "@shared/schema";
import { z } from "zod";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";
import {
  authorReviewAmendment,
  castRejectionVote,
  calculateCommunitySignals,
  buildSortitionInput,
  saveFinalText,
} from "./utils/amendment-processor";
import { INITIAL_PROPOSAL_STATE, isProposalState } from "@shared/proposal-lifecycle";
import { sanitizeCommunityCreateInput, sanitizeCommunityUpdateInput } from "@shared/community-settings";
import { buildCommunitySummary } from "@shared/community-summary";

/**
 * Helper function to format Zod validation errors in a more user-friendly way.
 * 
 * @param errors The raw Zod validation errors
 * @returns A more user-friendly error object
 */
function formatValidationErrors(errors: Record<string, any>): Record<string, any> {
  const formattedErrors: Record<string, any> = {};

  // Helper function to recursively process errors
  function processErrors(obj: Record<string, any>, path: string = "") {
    for (const key in obj) {
      const fullPath = path ? `${path}.${key}` : key;

      if (key === "_errors" && Array.isArray(obj[key])) {
        if (obj[key].length > 0) {
          // We have actual error messages here
          let location = path;
          if (location === "") {
            location = "general";
          }

          if (!formattedErrors[location]) {
            formattedErrors[location] = [];
          }

          // Add all error messages for this field
          for (const error of obj[key]) {
            formattedErrors[location].push(error);
          }
        }
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        // Recursively process nested objects
        processErrors(obj[key], fullPath);
      }
    }
  }

  processErrors(errors);

  // Special case for optionId which is often required in votes
  if (errors.optionId?._errors?.includes("Required")) {
    formattedErrors.optionId = ["Παρακαλώ επιλέξτε μια επιλογή"];
  }

  return formattedErrors;
}

export async function registerRoutes(app: Express): Promise<Server> {

  // Setup authentication routes
  setupAuth(app);

  // Consolidated route for /polls/:id with social bot detection
  app.get("/polls/:id", async (req, res, next) => {
    const userAgent = req.get('User-Agent') || '';

    // Detect social media crawlers and preview bots
    const isSocialBot = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|skypeuripreview|slackbot|discordbot/i.test(userAgent);

    if (!isSocialBot) {
      // Regular users - let frontend handle this route
      return next();
    }

    // Social bots - serve SEO-optimized HTML with Open Graph tags
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);

      if (!poll) {
        return next(); // Let frontend handle 404
      }

      const results = await storage.getPollResults(pollId);
      const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
      const isActive = new Date(poll.endDate) > new Date();

      // Clean description without HTML tags
      const cleanDescription = poll.description
        ? poll.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
        : '';

      // Optimized description for social sharing
      const shareDescription = cleanDescription
        ? `${cleanDescription.substring(0, 150)}... 🗳️ Ψηφίστε στο AgoraX!`
        : `🗳️ Συμμετέχετε στην ψηφοφορία και εκφράστε τη γνώμη σας!`;

      const pollUrl = `${req.protocol}://${req.get('host')}/polls/${pollId}`;
      const ogImage = `${req.protocol}://${req.get('host')}/api/og-image/${pollId}?v=3`;

      const html = `<!DOCTYPE html>
<html lang="el">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${poll.title} - AgoraX</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="article">
    <meta property="og:url" content="${pollUrl}">
    <meta property="og:title" content="${poll.title}">
    <meta property="og:description" content="${shareDescription}">
    <meta property="og:image" content="${ogImage}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:type" content="image/png">
    <meta property="og:site_name" content="AgoraX">
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${poll.title}">
    <meta name="twitter:description" content="${shareDescription}">
    <meta name="twitter:image" content="${ogImage}">
    
    <meta name="description" content="${shareDescription}">
</head>
<body>
    <div style="font-family: Arial; max-width: 600px; margin: 2rem auto; padding: 2rem;">
        <h1>${poll.title}</h1>
        <p>${cleanDescription}</p>
        <p>Κατηγορία: ${poll.category} • Ψήφοι: ${totalVotes} • ${isActive ? 'Ενεργή' : 'Κλειστή'}</p>
        <a href="${pollUrl}" style="background: #2563eb; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; display: inline-block;">Δείτε την ψηφοφορία</a>
    </div>
</body>
</html>`;

      res.send(html);
    } catch (error) {
      console.error("Error generating bot HTML:", error);
      next();
    }
  });

  // Open Graph image generation for social media previews (minimal design with logo)
  app.get("/api/og-image/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const poll = await storage.getPoll(pollId);

      if (!poll) {
        return res.status(404).send("Poll not found");
      }

      const { createCanvas, loadImage } = await import('canvas');
      const path = await import('path');

      // Standard OpenGraph size: 1200x630
      const width = 1200;
      const height = 630;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // Clean white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      // Load and draw logo (centered)
      try {
        const logoPath = path.resolve(process.cwd(), 'client/public/logo-share.png');
        const logo = await loadImage(logoPath);
        const logoSize = 200;
        const logoX = (width - logoSize) / 2;
        const logoY = (height - logoSize) / 2;
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
      } catch (err) {
        // If logo fails to load, show AgoraX text instead
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('AgoraX', width / 2, height / 2);
      }

      // Convert to PNG buffer
      const pngBuffer = canvas.toBuffer('image/png');

      // Serve PNG with caching headers
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Disposition', 'inline; filename="poll-preview.png"');
      res.send(pngBuffer);

    } catch (error) {
      console.error("Error generating OG image:", error);
      res.status(500).send("Error generating image");
    }
  });

  // Protected route middleware
  const requireAuth = (req: any, res: any, next: any) => {
    // Demo mode: bypass auth, use user 3 (maria) as demo user — author of proposal 1
    if (process.env.DEMO_MODE === 'true') {
      if (!req.user) {
        req.user = {
          id: 3,
          username: 'demo',
          email: 'demo@agorax.gr',
          name: 'Demo User',
          profilePicture: null,
          isAdmin: true,
          govgrVerified: true,
          locationConfirmed: false,
          locationVerified: false,
        };
        req.isAuthenticated = () => true;
      }
      return next();
    }
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    next();
  };

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      const { db } = await import('./db');
      await db.execute('SELECT 1');
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        version: '0.1.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        error: String(error)
      });
    }
  });

  // Poll routes
  app.get("/api/polls", async (req, res) => {
    try {
      const {
        status,
        category,
        sort,
        page = "1",
        pageSize = "9",
        locationScope,
        locationCountry,
        locationRegion,
        locationCity,
      } = req.query;

      const filters = {
        status: status as string,
        category: category as string,
        sort: sort as string,
        page: parseInt(page as string),
        pageSize: parseInt(pageSize as string),
        userId: req.isAuthenticated() ? req.user.id : undefined,
        locationScope: locationScope as string,
        locationCountry: locationCountry as string,
        locationRegion: locationRegion as string,
        locationCity: locationCity as string,
      };

      const polls = await storage.getPolls(filters);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ψηφοφοριών" });
    }
  });

  app.get("/api/polls/my", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const polls = await storage.getUserPolls(userId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των ψηφοφοριών σας" });
    }
  });

  app.get("/api/polls/participated", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const polls = await storage.getParticipatedPolls(userId);
      res.json(polls);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των συμμετοχών σας" });
    }
  });

  app.get("/api/polls/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const poll = await storage.getPoll(pollId, userId);

      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      res.json(poll);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση της ψηφοφορίας" });
    }
  });

  app.post("/api/polls", requireAuth, async (req, res) => {
    try {
      console.log("Creating poll with data:", JSON.stringify(req.body, null, 2));

      const parsedData = createPollSchema.safeParse(req.body);

      if (!parsedData.success) {
        console.log("Poll data validation failed:", parsedData.error.format());
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα ψηφοφορίας",
          errors: parsedData.error.format()
        });
      }

      console.log("Parsed poll data:", JSON.stringify(parsedData.data, null, 2));
      const { poll, options } = parsedData.data;
      const creatorId = req.user!.id;

      console.log("Creating poll with creator:", creatorId);
      console.log("Poll object:", JSON.stringify({ ...poll, creatorId }, null, 2));
      console.log("Options:", JSON.stringify(options, null, 2));

      try {
        const createdPoll = await storage.createPoll({
          ...poll,
          creatorId
        }, options);

        res.status(201).json(createdPoll);
      } catch (storageError) {
        console.error("Error in storage.createPoll:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία ψηφοφορίας", error: String(error) });
    }
  });

  app.patch("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      console.log("Poll update request received for poll ID:", pollId);
      console.log("Update data:", JSON.stringify(req.body, null, 2));

      // Check if user is the creator
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή την ψηφοφορία" });
      }

      // Handle empty strings in numeric fields to avoid database errors
      const updates = { ...req.body };

      // Remove creatorId from updates to preserve the original creator
      // This prevents foreign key constraint issues
      delete updates.creatorId;

      // Special handling for description - must be at least empty string, not null
      if (updates.description === '' || updates.description === null) {
        updates.description = ''; // Empty string instead of null to satisfy not-null constraint
      }

      // Fix potential issues with empty coordinate strings
      if (updates.centerLat === '') updates.centerLat = null;
      if (updates.centerLng === '') updates.centerLng = null;
      if (updates.radiusKm === '') updates.radiusKm = null;

      // Handle empty location strings
      if (updates.locationCity === '') updates.locationCity = null;
      if (updates.locationRegion === '') updates.locationRegion = null;
      if (updates.locationCountry === '') updates.locationCountry = null;

      // Fix date fields - convert to proper Date objects
      if (updates.startDate && typeof updates.startDate === 'string') {
        updates.startDate = new Date(updates.startDate);
      }
      if (updates.endDate && typeof updates.endDate === 'string') {
        updates.endDate = new Date(updates.endDate);
      }

      // Clean up empty string values to avoid database errors
      // But exclude description field which needs to remain an empty string
      Object.keys(updates).forEach(key => {
        if (key !== 'description' && updates[key] === '') {
          updates[key] = null;
        }
      });

      console.log("Processed updates:", JSON.stringify(updates, null, 2));

      const updatedPoll = await storage.updatePoll(pollId, updates);
      res.json(updatedPoll);
    } catch (error) {
      console.error("Error updating poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της ψηφοφορίας", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/polls/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να διαγράψετε αυτή την ψηφοφορία" });
      }

      // Check if the poll has more than 100 participants
      const participantCount = await storage.getPollParticipantCount(pollId);
      if (participantCount > 100) {
        return res.status(403).json({
          message: "Δεν μπορείτε να διαγράψετε μια ψηφοφορία με πάνω από 100 συμμετέχοντες",
          canSetCommunity: true // Indicate that community mode is an option
        });
      }

      const result = await storage.deletePoll(pollId);
      if (result) {
        res.json({ success: true, message: "Η ψηφοφορία διαγράφηκε επιτυχώς" });
      } else {
        res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
    }
  });

  // Endpoint to set poll to community mode (removing creator association)
  app.patch("/api/polls/:id/community", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να μεταφέρετε αυτή την ψηφοφορία" });
      }

      // Update the poll to community mode
      const updatedPoll = await storage.updatePoll(pollId, { communityMode: true });
      res.json({ success: true, message: "Η ψηφοφορία μεταφέρθηκε στην κοινότητα", poll: updatedPoll });
    } catch (error) {
      console.error("Error setting poll to community mode:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη μεταφορά της ψηφοφορίας" });
    }
  });

  app.patch("/api/polls/:id/extend", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { newEndDate } = req.body;

      if (!newEndDate) {
        return res.status(400).json({ message: "Απαιτείται νέα ημερομηνία λήξης" });
      }

      // Check if user is the creator
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεκτείνετε αυτή την ψηφοφορία" });
      }

      if (!poll.allowExtension) {
        return res.status(400).json({ message: "Η επέκταση δεν επιτρέπεται για αυτή την ψηφοφορία" });
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Δεν μπορείτε να επεκτείνετε μια ολοκληρωμένη ψηφοφορία" });
      }

      const updatedPoll = await storage.extendPollDuration(pollId, new Date(newEndDate));
      res.json(updatedPoll);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την επέκταση της ψηφοφορίας" });
    }
  });

  app.post("/api/polls/:id/vote", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if poll exists and is active
      const poll = await storage.getPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Η ψηφοφορία έχει ολοκληρωθεί" });
      }

      // Get user data to check location eligibility
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Χρήστης δεν βρέθηκε" });
      }

      // Check for Gov.gr verification - MANDATORY for all votes
      if (!user.govgrVerified) {
        return res.status(403).json({
          message: "Απαιτείται επαλήθευση ταυτότητας Gov.gr για να ψηφίσετε. Παρακαλώ επαληθεύστε την ταυτότητά σας πρώτα."
        });
      }


      // Import the location validator
      const { isUserEligibleForPoll } = await import('./utils/location-validator');

      // Check if user is eligible to vote based on location restrictions
      const eligibility = isUserEligibleForPoll(poll, user);
      console.log(`[VOTE] Eligibility result:`, eligibility);

      if (!eligibility.isEligible) {
        return res.status(403).json({
          message: eligibility.message || "Δεν επιτρέπεται να ψηφίσετε λόγω περιορισμών τοποθεσίας"
        });
      }

      // Check if user already voted
      const hasVoted = await storage.hasUserVoted(pollId, userId);
      console.log(`[VOTE] User ${userId} has voted: ${hasVoted}`);

      // If they already voted, check if they can edit their vote
      if (hasVoted) {
        // Check if vote can be edited (within 60 minutes)
        const canEdit = await storage.canEditVote(pollId, userId);
        console.log(`[VOTE] Can edit vote: ${canEdit}`);
        if (!canEdit) {
          return res.status(403).json({
            message: "Δεν μπορείτε να αλλάξετε την ψήφο σας μετά από 60 λεπτά",
            canEdit: false
          });
        }

        // Delete the existing vote before creating a new one
        console.log(`[VOTE] Deleting existing votes for user ${userId} on poll ${pollId}`);
        await db.delete(votes).where(
          and(
            eq(votes.pollId, pollId),
            eq(votes.userId, userId)
          )
        );

        // The vote will be recreated below
      }

      // Handle different poll types
      if (poll.pollType === 'ranking') {
        // For ranking polls, validate with rankingVoteSchema
        const validateRankingVote = rankingVoteSchema.safeParse({
          ...req.body,
          pollId,
          userId
        });

        if (!validateRankingVote.success) {
          // Format the validation errors to be more user-friendly
          const formattedErrors = formatValidationErrors(validateRankingVote.error.format());

          return res.status(400).json({
            message: "Λανθασμένα δεδομένα κατάταξης",
            errors: formattedErrors,
            errorType: "validation" // Indicate that these are validation errors
          });
        }

        const vote = await storage.createVote(validateRankingVote.data);
        return res.status(201).json({
          ...vote,
          isEdit: hasVoted
        });
      } else {
        // For regular polls, handle both single choice and multiple choice
        console.log("Received vote data:", req.body);
        console.log("Vote data for validation:", { ...req.body, pollId, userId });

        // Check if this is a multiple choice vote (has optionIds array)
        if (req.body.optionIds && Array.isArray(req.body.optionIds)) {
          // Multiple choice voting - create separate votes for each option
          const votes = [];

          for (const optionId of req.body.optionIds) {
            const validateVote = insertVoteSchema.safeParse({
              optionId,
              pollId,
              userId,
              comment: req.body.comment
            });

            if (!validateVote.success) {
              const formattedErrors = formatValidationErrors(validateVote.error.format());
              console.log("Vote validation failed for option", optionId, ":", validateVote.error);

              return res.status(400).json({
                message: "Λανθασμένα δεδομένα ψήφου",
                errors: formattedErrors,
                errorType: "validation"
              });
            }

            const vote = await storage.createVote(validateVote.data);
            votes.push(vote);
          }

          return res.status(201).json({
            votes,
            isEdit: hasVoted,
            count: votes.length
          });
        } else {
          // Single choice voting
          const validateVote = insertVoteSchema.safeParse({
            ...req.body,
            pollId,
            userId
          });

          if (!validateVote.success) {
            const formattedErrors = formatValidationErrors(validateVote.error.format());
            console.log("Vote validation failed:", validateVote.error);
            console.log("Formatted errors:", formattedErrors);

            return res.status(400).json({
              message: "Λανθασμένα δεδομένα ψήφου",
              errors: formattedErrors,
              errorType: "validation"
            });
          }

          const vote = await storage.createVote(validateVote.data);
          return res.status(201).json({
            ...vote,
            isEdit: hasVoted
          });
        }
      }
    } catch (error) {
      console.error("Vote submission error:", error);
      res.status(500).json({ message: "Σφάλμα κατά την υποβολή ψήφου" });
    }
  });

  app.get("/api/polls/:id/results", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const results = await storage.getPollResults(pollId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των αποτελεσμάτων" });
    }
  });

  app.post("/api/polls/:id/comments", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      const validateComment = insertCommentSchema.safeParse({
        ...req.body,
        pollId,
        userId
      });

      if (!validateComment.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα σχολίου",
          errors: validateComment.error.format()
        });
      }

      // Check if poll exists and allows comments
      const poll = await storage.getPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
      }

      if (!poll.allowComments) {
        return res.status(400).json({ message: "Τα σχόλια δεν επιτρέπονται σε αυτή την ψηφοφορία" });
      }

      const comment = await storage.createComment(validateComment.data);
      res.status(201).json(comment);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία σχολίου" });
    }
  });

  app.get("/api/polls/:id/comments", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const comments = await storage.getPollComments(pollId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση σχολίων" });
    }
  });

  // Group routes were retired. The `groups` and `group_members` tables remain in
  // the schema for backwards compatibility, but groups are no longer a primary
  // civic surface — communities are. See ROADMAP §1.3.

  // Notification routes
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ειδοποιήσεων" });
    }
  });

  app.post("/api/notifications/:id/read", requireAuth, async (req, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      const userId = req.user!.id;

      const notifications = await storage.getUserNotifications(userId);
      const notification = notifications.find(n => n.id === notificationId);

      if (!notification) {
        return res.status(404).json({ message: "Η ειδοποίηση δεν βρέθηκε" });
      }

      if (notification.userId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα πρόσβασης σε αυτή την ειδοποίηση" });
      }

      const updatedNotification = await storage.markNotificationAsRead(notificationId);
      res.json({ success: true, notification: updatedNotification });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση ειδοποίησης" });
    }
  });

  app.get("/api/notifications/unread/count", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getUserNotifications(userId);
      const unreadCount = notifications.filter(n => !n.read).length;
      res.json({ count: unreadCount });
    } catch (error) {
      console.error("Error fetching unread notification count:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση μη αναγνωσμένων ειδοποιήσεων" });
    }
  });

  app.get("/api/categories", async (req, res) => {
    try {
      const categories = [
        // Politics & Democracy
        "Πολιτική",
        "Τοπική Αυτοδιοίκηση",
        "Νομοθεσία",
        "Δημόσια Διοίκηση",
        "Εκλογές",
        "Προϋπολογισμός",
        "Δημοκρατία",
        "Διαφάνεια",
        "Συμμετοχή",
        "Ευρωπαϊκή Ένωση",

        // Economy & Society
        "Περιβάλλον",
        "Οικονομία",
        "Κοινωνία",
        "Δικαιοσύνη",
        "Παιδεία",
        "Υγεία",
        "Ασφάλεια",

        // Science & Technology
        "Τεχνολογία",
        "Επιστήμη",
        "Καινοτομία",
        "Φυσική",
        "Πληροφορική",
        "Τεχνητή Νοημοσύνη",
        "Διάστημα",
        "Δεδομένα",
        "Υπολογιστικό Νέφος",

        // Culture & Infrastructure
        "Πολιτισμός",
        "Υποδομές",
        "Στρατηγικός Σχεδιασμός",
        "Βιομηχανία",
        "Επιχειρήσεις",

        // Other
        "Άλλο"
      ];
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση κατηγοριών" });
    }
  });

  // User location routes
  const locationSchema = z.object({
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    locationConfirmed: z.boolean().optional(),
  });

  // Location verification schema
  const verifyLocationSchema = z.object({
    verified: z.boolean()
  });

  // Endpoint to verify manually entered coordinates
  app.patch("/api/user/verify-location", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Δεν είστε συνδεδεμένοι" });
      }

      const parsedData = verifyLocationSchema.safeParse(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα επαλήθευσης",
          errors: parsedData.error.format()
        });
      }

      // Update the user's location verification status
      const updated = await storage.verifyUserLocation(userId, parsedData.data.verified);

      // If verification is false, reset the location confirmation as well
      if (!parsedData.data.verified) {
        await storage.updateUserLocation(userId, {
          locationConfirmed: false,
          locationVerified: false
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error verifying location:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση τοποθεσίας" });
    }
  });

  app.patch("/api/user/location", requireAuth, async (req, res) => {
    try {
      const userId = req.user!.id;
      const parsedData = locationSchema.safeParse(req.body);

      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα τοποθεσίας",
          errors: parsedData.error.format()
        });
      }

      const updatedUser = await storage.updateUserLocation(userId, parsedData.data);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της τοποθεσίας" });
    }
  });

  // The verify-location endpoint is already defined above

  // Survey Poll Routes
  app.post("/api/surveys", requireAuth, async (req, res) => {
    try {
      console.log("Creating survey poll with data:", JSON.stringify(req.body, null, 2));

      const parsedData = createSurveyPollSchema.safeParse(req.body);

      if (!parsedData.success) {
        console.log("Survey poll data validation failed:", parsedData.error.format());
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα δημοσκόπησης",
          errors: parsedData.error.format()
        });
      }

      console.log("Parsed survey poll data:", JSON.stringify(parsedData.data, null, 2));
      const { poll, questions } = parsedData.data;
      const creatorId = req.user!.id;

      // Organize answers by question
      const questionAnswers = questions.map(question => ({
        questionId: question.id,
        answers: question.answers.map((answer, index) => ({
          id: answer.id || index + 1, // Use provided ID or generate one
          text: answer.text,
          order: answer.order || index
        }))
      }));

      // Prepare questions without answers
      const questionData = questions.map(question => {
        const { answers, ...questionWithoutAnswers } = question;
        return questionWithoutAnswers;
      });

      try {
        const createdPoll = await storage.createSurveyPoll({
          ...poll,
          creatorId
        }, questionData, questionAnswers);

        res.status(201).json(createdPoll);
      } catch (storageError) {
        console.error("Error in storage.createSurveyPoll:", storageError);
        throw storageError;
      }
    } catch (error) {
      console.error("Error creating survey poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία δημοσκόπησης", error: String(error) });
    }
  });

  app.get("/api/surveys/:id", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.isAuthenticated() ? req.user.id : undefined;
      const poll = await storage.getSurveyPoll(pollId, userId);

      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      res.json(poll);
    } catch (error) {
      console.error("Error retrieving survey poll:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση της δημοσκόπησης", error: String(error) });
    }
  });

  app.post("/api/surveys/:id/respond", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if poll exists and is active
      const poll = await storage.getSurveyPoll(pollId, userId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      if (!poll.isActive) {
        return res.status(400).json({ message: "Η δημοσκόπηση έχει ολοκληρωθεί" });
      }

      // Get user data to check location eligibility
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Χρήστης δεν βρέθηκε" });
      }

      // Import the location validator
      const { isUserEligibleForPoll } = await import('./utils/location-validator');

      // Check if user is eligible to participate based on location restrictions
      const eligibility = isUserEligibleForPoll(poll, user);
      if (!eligibility.isEligible) {
        return res.status(403).json({
          message: eligibility.message || "Δεν επιτρέπεται να συμμετάσχετε λόγω περιορισμών τοποθεσίας"
        });
      }

      // Check if user already responded
      const hasResponded = await storage.hasUserRespondedToSurvey(pollId, userId);
      if (hasResponded) {
        return res.status(400).json({ message: "Έχετε ήδη απαντήσει σε αυτή τη δημοσκόπηση" });
      }

      // Validate responses
      const responsesArray = req.body.responses;
      if (!Array.isArray(responsesArray) || responsesArray.length === 0) {
        return res.status(400).json({ message: "Οι απαντήσεις πρέπει να παρέχονται ως πίνακας" });
      }

      // Validate each response has answerId (except for ordering questions which use answerValue)
      // Use loose equality (==) to catch both null and undefined
      for (const response of responsesArray) {
        if (response.answerId == null && !response.answerValue) {
          return res.status(400).json({
            message: "Κάθε απάντηση πρέπει να έχει answerId ή answerValue"
          });
        }
      }

      // Add pollId and userId to each response
      const responses = responsesArray.map(response => ({
        ...response,
        pollId,
        userId
      }));

      // Create responses
      const createdResponses = await storage.createSurveyResponse(responses);
      res.status(201).json(createdResponses);
    } catch (error) {
      console.error("Error responding to survey:", error);
      res.status(500).json({ message: "Σφάλμα κατά την υποβολή απαντήσεων", error: String(error) });
    }
  });

  app.get("/api/surveys/:id/results", async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);

      // Verify poll exists
      const poll = await storage.getSurveyPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      // Check if results are visible
      if (!poll.showResults && !req.isAuthenticated()) {
        return res.status(403).json({ message: "Τα αποτελέσματα αυτής της δημοσκόπησης δεν είναι δημόσια" });
      }

      // If not creator and results not visible, deny access
      if (!poll.showResults && req.isAuthenticated() && req.user.id !== poll.creatorId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να δείτε τα αποτελέσματα αυτής της δημοσκόπησης" });
      }

      const results = await storage.getSurveyResults(pollId);
      res.json(results);
    } catch (error) {
      console.error("Error retrieving survey results:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των αποτελεσμάτων", error: String(error) });
    }
  });

  app.patch("/api/surveys/:id", requireAuth, async (req, res) => {
    try {
      const pollId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if user is the creator
      const poll = await storage.getSurveyPoll(pollId);
      if (!poll) {
        return res.status(404).json({ message: "Η δημοσκόπηση δεν βρέθηκε" });
      }

      if (poll.creatorId !== userId) {
        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή τη δημοσκόπηση" });
      }

      // If we have questions in the body, parse as a full update
      if (req.body.questions) {
        const parsedData = createSurveyPollSchema.safeParse(req.body);

        if (!parsedData.success) {
          return res.status(400).json({
            message: "Λανθασμένα δεδομένα δημοσκόπησης",
            errors: parsedData.error.format()
          });
        }

        const { poll: pollData, questions } = parsedData.data;

        // Organize answers by question
        const questionAnswers = questions.map(question => ({
          questionId: question.id,
          answers: question.answers.map((answer, index) => ({
            id: answer.id || index + 1,
            text: answer.text,
            order: answer.order || index
          }))
        }));

        // Prepare questions without answers
        const questionData = questions.map(question => {
          const { answers, ...questionWithoutAnswers } = question;
          return questionWithoutAnswers;
        });

        const updatedPoll = await storage.updateSurveyStructure(
          pollId,
          { ...pollData, creatorId: poll.creatorId },
          questionData,
          questionAnswers
        );

        res.json(updatedPoll);
      } else {
        // Simple update of poll metadata (no structural changes)
        const updatedPoll = await storage.updateSurveyMetadata(pollId, req.body);
        res.json(updatedPoll);
      }
    } catch (error) {
      console.error("Error updating survey poll:", error);

      const message = error instanceof Error ? error.message : String(error);

      // Check if error is about structural edits being blocked
      if (message.includes("Cannot modify survey structure")) {
        return res.status(400).json({
          message: "Δεν μπορείτε να τροποποιήσετε τις ερωτήσεις ή απαντήσεις αφού έχουν υποβληθεί απαντήσεις",
          error: message,
        });
      }

      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της δημοσκόπησης", error: message });
    }
  });

  // Poll location update utility route
  app.post("/api/admin/update-poll-locations", requireAuth, async (req, res) => {
    try {
      // Only allow admin users to run this utility
      if (req.user?.id !== 1) { // Assuming user ID 1 is admin
        return res.status(403).json({ message: "Only administrators can update poll locations" });
      }

      console.log("Starting poll locations update process");

      // Run the update process
      await updatePollLocations();

      res.json({
        success: true,
        message: "Poll locations update process completed successfully"
      });
    } catch (error) {
      console.error("Error updating poll locations:", error);
      res.status(500).json({
        message: "Error updating poll locations",
        error: String(error)
      });
    }
  });

  // Admin-only access control middleware
  const requireAdmin = (req: any, res: any, next: any) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!req.user?.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  };

  // Analytics Dashboard Endpoints (Public - Platform Statistics)
  // Note: These endpoints are publicly accessible as they show aggregate platform statistics
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error: any) {
      console.error("Error fetching analytics overview:", error);
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });

  app.get("/api/analytics/poll-popularity", async (req, res) => {
    try {
      const popularity = await storage.getPollPopularityStats();
      res.json(popularity);
    } catch (error: any) {
      console.error("Error fetching poll popularity:", error);
      res.status(500).json({ error: "Failed to fetch poll popularity data" });
    }
  });

  app.get("/api/analytics/activity-trends", async (req, res) => {
    try {
      const trends = await storage.getActivityTrends();
      res.json(trends);
    } catch (error: any) {
      console.error("Error fetching activity trends:", error);
      res.status(500).json({ error: "Failed to fetch activity trends" });
    }
  });

  app.get("/api/analytics/usage-patterns", async (req, res) => {
    try {
      const patterns = await storage.getUsagePatterns();
      res.json(patterns);
    } catch (error: any) {
      console.error("Error fetching usage patterns:", error);
      res.status(500).json({ error: "Failed to fetch usage patterns" });
    }
  });

  // Admin Account Management Endpoints
  app.get("/api/admin/accounts", requireAdmin, async (req, res) => {
    try {
      const { status, search } = req.query;

      const filters = {
        status: status && status !== 'undefined' ? status as string : undefined,
        search: search && search !== 'undefined' ? search as string : undefined
      };

      const users = await storage.getAllUsersWithAccountInfo(filters);
      res.json(users);
    } catch (error: any) {
      console.error("Error fetching user accounts:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των λογαριασμών χρηστών" });
    }
  });

  app.get("/api/admin/accounts/:userId/activity", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const activity = await storage.getUserAccountActivity(userId);
      res.json(activity);
    } catch (error: any) {
      console.error("Error fetching user activity:", error);
      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση του ιστορικού δραστηριότητας" });
    }
  });

  app.post("/api/admin/accounts/:userId/ban", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const updatedUser = await storage.updateAccountStatus(userId, 'banned');
      res.json({
        success: true,
        message: "Ο λογαριασμός χρήστη έχει αποκλειστεί επιτυχώς",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error banning user account:", error);
      res.status(500).json({ message: "Σφάλμα κατά τον αποκλεισμό του λογαριασμού χρήστη" });
    }
  });

  app.post("/api/admin/accounts/:userId/approve", requireAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "Μη έγκυρο αναγνωριστικό χρήστη" });
      }

      const updatedUser = await storage.updateAccountStatus(userId, 'active');
      res.json({
        success: true,
        message: "Ο λογαριασμός χρήστη έχει εγκριθεί επιτυχώς",
        user: updatedUser
      });
    } catch (error: any) {
      console.error("Error approving user account:", error);
      res.status(500).json({ message: "Σφάλμα κατά την έγκριση του λογαριασμού χρήστη" });
    }
  });

  // ============================================
  // GOV.GR BALLOT VOTING ROUTES
  // ============================================
  // These routes proxy to the Python ballot validation service
  // for verifying Gov.gr Solemn Declaration PDFs as certified ballots

  const multer = (await import('multer')).default;
  const ballotUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/pdf') {
        cb(null, true);
      } else {
        cb(new Error('Only PDF files are allowed'));
      }
    }
  });

  // Generate a poll token for ballot voting
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
      const { generatePollToken } = await import('./utils/ballot-client');
      const token = generatePollToken();

      res.json({ token, pollId: String(pollId) });
    } catch (error) {
      console.error("Error generating ballot token:", error);
      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία token" });
    }
  });

  // Get ballot voting instructions
  app.get("/api/ballot/instructions", requireAuth, async (req, res) => {
    try {
      const { pollId, pollToken } = req.query;

      if (!pollId || !pollToken) {
        return res.status(400).json({ message: "Poll ID and token are required" });
      }

      const { getBallotInstructions } = await import('./utils/ballot-client');
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

  // Upload and validate a ballot PDF
  app.post("/api/ballot/validate", requireAuth, ballotUpload.single('file'), async (req: any, res) => {
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
      const { validateBallot } = await import('./utils/ballot-client');
      const result = await validateBallot(
        file.buffer,
        String(pollId),
        String(pollToken),
      );

      if (result.success) {
        // Vote was recorded in Python service
        // Optionally sync to main DB for unified reporting
        console.log(`Ballot vote recorded for poll ${pollId}: ${result.vote_choice}`);

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

  // Get ballot voting statistics
  app.get("/api/ballot/stats/:pollId", async (req, res) => {
    try {
      const pollId = req.params.pollId;

      const { getBallotStats } = await import('./utils/ballot-client');
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

  // Check ballot service health
  app.get("/api/ballot/health", async (req, res) => {
    try {
      const { checkBallotServiceHealth } = await import('./utils/ballot-client');
      const isHealthy = await checkBallotServiceHealth();

      res.json({
        status: isHealthy ? 'healthy' : 'unavailable',
        service: 'ballot-validator'
      });
    } catch (error) {
      res.json({ status: 'unavailable', service: 'ballot-validator' });
    }
  });

  // One-time Gov.gr Identity Verification
  app.post("/api/user/verify-govgr", requireAuth, ballotUpload.single('file'), async (req: any, res) => {
    try {
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
      }

      // Verify identity via Python ballot service
      const { verifyIdentity } = await import('./utils/ballot-client');
      const result = await verifyIdentity(file.buffer);

      if (result.success) {
        // Check if this voter hash is already used by another account
        const voterHash = result.voter_hash || "";
        if (voterHash) {
          const existingUser = await storage.getUserByVoterHash(voterHash);
          if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({
              success: false,
              message: "Αυτή η ταυτότητα είναι ήδη συνδεδεμένη με άλλο λογαριασμό",
              rejection_reason: "already_verified"
            });
          }
        }

        // Update user record with verification info
        await storage.updateUser(req.user.id, {
          govgrVerified: true,
          govgrVerifiedAt: new Date(),
          govgrVoterHash: voterHash || "hash-missing",
        });

        return res.status(200).json({
          success: true,
          message: "Η ταυτότητά σας επαληθεύτηκε επιτυχώς μέσω Gov.gr",
          signer_name: result.signer_name,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message,
          rejection_reason: result.rejection_reason,
        });
      }
    } catch (error) {
      console.error("Error verifying identity:", error);
      res.status(500).json({ message: "Σφάλμα κατά την επαλήθευση ταυτότητας" });
    }
  });

  // ─── Demopolis: Community Routes ────────────────────────────────────────────

  // List communities (public)
  app.get("/api/communities", async (req, res) => {
    try {
      const userId = req.user?.id;
      const communities = await storage.getCommunities(userId);
      res.json(communities);
    } catch (error) {
      console.error("Error fetching communities:", error);
      res.status(500).json({ message: "Failed to fetch communities" });
    }
  });

  // Create community (authenticated)
  app.post("/api/communities", requireAuth, async (req: any, res) => {
    try {
      const communitySettings = sanitizeCommunityCreateInput(req.body);

      const community = await storage.createCommunity({
        ...communitySettings,
        creatorId: req.user.id,
      });

      // Auto-add creator as founder
      await storage.addCommunityMember(community.id, req.user.id, 'founder');

      res.status(201).json(community);
    } catch (error) {
      console.error("Error creating community:", error);
      res.status(500).json({ message: "Failed to create community" });
    }
  });

  // Get community details
  app.get("/api/communities/:id", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });
      res.json(community);
    } catch (error) {
      console.error("Error fetching community:", error);
      res.status(500).json({ message: "Failed to fetch community" });
    }
  });

  // Get coherent community dashboard summary
  app.get("/api/communities/:id/summary", async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);
      if (!community) return res.status(404).json({ message: "Community not found" });

      const [members, proposals] = await Promise.all([
        storage.getCommunityMembers(communityId),
        storage.getProposals(communityId),
      ]);
      const currentUserRole = req.user?.id
        ? await storage.getCommunityMemberRole(communityId, req.user.id)
        : undefined;

      res.json(buildCommunitySummary(community, proposals, members.length, currentUserRole));
    } catch (error) {
      console.error("Error fetching community summary:", error);
      res.status(500).json({ message: "Failed to fetch community summary" });
    }
  });

  // Update community (admin/founder only)
  app.patch("/api/communities/:id", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const role = await storage.getCommunityMemberRole(communityId, req.user.id);
      
      if (!role || (role !== 'admin' && role !== 'founder')) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const communitySettings = sanitizeCommunityUpdateInput(req.body);
      const community = await storage.updateCommunity(communityId, communitySettings);
      res.json(community);
    } catch (error) {
      console.error("Error updating community:", error);
      res.status(500).json({ message: "Failed to update community" });
    }
  });

  // Get community members
  app.get("/api/communities/:id/members", async (req, res) => {
    try {
      const members = await storage.getCommunityMembers(parseInt(req.params.id));
      res.json(members);
    } catch (error) {
      console.error("Error fetching members:", error);
      res.status(500).json({ message: "Failed to fetch members" });
    }
  });

  // Join community (authenticated)
  app.post("/api/communities/:id/members", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if already a member
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (isMember) {
        return res.status(409).json({ message: "Already a member" });
      }

      const member = await storage.addCommunityMember(communityId, userId);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error joining community:", error);
      res.status(500).json({ message: "Failed to join community" });
    }
  });

  // Leave community (authenticated)
  app.delete("/api/communities/:id/members", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const userId = req.user!.id;

      await storage.removeCommunityMember(communityId, userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error leaving community:", error);
      res.status(500).json({ message: "Failed to leave community" });
    }
  });

  // ─── Demopolis: Proposal Routes ────────────────────────────────────────────

  // Global proposals endpoint (all communities)
  app.get("/api/proposals", async (req, res) => {
    try {
      const { limit } = req.query;
      const proposals = await storage.getAllProposals(limit ? parseInt(limit as string) : undefined);
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // List proposals for a community
  app.get("/api/communities/:communityId/proposals", async (req, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const { status, category } = req.query;
      
      const proposals = await storage.getProposals(communityId, {
        status: status as string,
        category: category as string,
      });
      res.json(proposals);
    } catch (error) {
      console.error("Error fetching proposals:", error);
      res.status(500).json({ message: "Failed to fetch proposals" });
    }
  });

  // Create proposal (authenticated, must be community member)
  app.post("/api/communities/:communityId/proposals", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.communityId);
      const userId = req.user!.id;

      // Check membership
      const isMember = await storage.isCommunityMember(communityId, userId);
      if (!isMember) {
        return res.status(403).json({ message: "Must be a community member to submit proposals" });
      }

      const { question, solution, category } = req.body;

      if (!question || !solution) {
        return res.status(400).json({ message: "Question and solution are required" });
      }

      const proposal = await storage.createProposal({
        communityId,
        authorId: userId,
        question,
        solution,
        category,
        status: INITIAL_PROPOSAL_STATE,
      });

      res.status(201).json(proposal);
    } catch (error) {
      console.error("Error creating proposal:", error);
      res.status(500).json({ message: "Failed to create proposal" });
    }
  });

  // Get proposal details
  app.get("/api/proposals/:id", async (req, res) => {
    try {
      const proposal = await storage.getProposal(parseInt(req.params.id));
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      res.json(proposal);
    } catch (error) {
      console.error("Error fetching proposal:", error);
      res.status(500).json({ message: "Failed to fetch proposal" });
    }
  });

  // Update proposal (author only, draft only)
  app.patch("/api/proposals/:id", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      if (proposal.authorId !== req.user.id) return res.status(403).json({ message: "Not the author" });
      if (proposal.status !== 'draft') return res.status(409).json({ message: "Can only edit drafts" });

      const updated = await storage.updateProposal(proposalId, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating proposal:", error);
      res.status(500).json({ message: "Failed to update proposal" });
    }
  });

  // Submit proposal for review (author only)
  app.post("/api/proposals/:id/submit", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      if (proposal.authorId !== req.user.id) return res.status(403).json({ message: "Not the author" });
      if (proposal.status !== 'draft') return res.status(409).json({ message: "Already submitted" });

      const { transitionProposal, triggerSideEffects } = await import('./utils/proposal-state-machine');
      const { storage: storageInstance } = await import('./storage');

      // draft → review (validated by the state machine; archived states blocked).
      const inReview = await transitionProposal(proposal, 'review', storageInstance);
      await triggerSideEffects(proposal.status, 'review', inReview);

      // ─── LLM Validation while the proposal sits in `review` ───────────────
      let llmScore: string | undefined;
      let llmFeedback: string | undefined;
      let llmValidatedAt: Date | undefined;
      let nextStatus: 'author_review' | 'draft' | 'review' = 'review';
      let category: 'return' | 'sortition' | 'auto_approve' | null = null;

      try {
        const { validateProposal } = await import('./utils/llm-validation');
        const result = await validateProposal(proposal.question, proposal.solution);

        llmScore = String(result.score);
        llmFeedback = result.feedback;
        llmValidatedAt = new Date();
        category = result.category;

        // Canonical lifecycle mapping from review:
        // - return:   review → draft   (author revises)
        // - sortition / auto_approve: review → author_review (amendments open)
        nextStatus = result.category === 'return' ? 'draft' : 'author_review';
      } catch (llmError) {
        console.error('LLM validation failed:', llmError);
        // Persist the failure on the row but leave it in `review` for manual handling.
        llmFeedback = 'Το σύστημα αξιολόγησης δεν ήταν διαθέσιμο. Η πρόταση θα εξεταστεί χειροκίνητα.';
        llmValidatedAt = new Date();
      }

      // Persist the LLM scoring on the in-review row first so the columns stay
      // populated even if the follow-up transition is skipped.
      const scored = await storageInstance.updateProposal(proposalId, {
        llmScore,
        llmFeedback,
        llmValidatedAt,
      });

      let updated = scored;
      if (nextStatus !== 'review') {
        updated = await transitionProposal(scored, nextStatus, storageInstance);
        await triggerSideEffects('review', nextStatus, updated);
      }

      res.json({
        ...updated,
        validation: {
          score: llmScore ? Number(llmScore) : null,
          feedback: llmFeedback,
          category,
        },
      });
    } catch (error) {
      console.error("Error submitting proposal:", error);
      res.status(500).json({ message: "Failed to submit proposal" });
    }
  });

  // ─── Demopolis: Amendment Routes ───────────────────────────────────────────

  // List amendments for a proposal
  app.get("/api/proposals/:id/amendments", async (req, res) => {
    try {
      const amendments = await storage.getAmendments(parseInt(req.params.id));
      res.json(amendments);
    } catch (error) {
      console.error("Error fetching amendments:", error);
      res.status(500).json({ message: "Failed to fetch amendments" });
    }
  });

  // Create amendment (authenticated, must be community member)
  app.post("/api/proposals/:id/amendments", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      
      const isMember = await storage.isCommunityMember(proposal.communityId, req.user!.id);
      if (!isMember) return res.status(403).json({ message: "Must be a community member" });

      // Check amendment cap
      const community = await storage.getCommunity(proposal.communityId);
      const cap = community?.maxAmendmentsPerProposal ?? -1;
      if (cap > 0) {
        const currentCount = await storage.countAmendmentsForProposal(proposalId);
        if (currentCount >= cap) {
          return res.status(400).json({
            message: `Amendment limit reached (${cap} per proposal)`,
          });
        }
      }

      const { type, text } = req.body;

      if (!type || !text) {
        return res.status(400).json({ message: "Type and text are required" });
      }

      const amendment = await storage.createAmendment({
        proposalId,
        authorId: req.user.id,
        type,
        text,
        status: 'pending',
      });

      const { findDuplicateAmendments } = await import('./utils/amendment-merger');
      const groups = await findDuplicateAmendments(proposalId);
      const duplicateGroup = groups.find(g => g.amendmentIds.includes(amendment.id));

      res.status(201).json({
        ...amendment,
        duplicate: duplicateGroup
          ? {
              representativeId: duplicateGroup.representativeId,
              siblingIds: duplicateGroup.amendmentIds.filter(id => id !== amendment.id),
              similarity: duplicateGroup.similarity,
            }
          : null,
      });
    } catch (error) {
      console.error("Error creating amendment:", error);
      res.status(500).json({ message: "Failed to create amendment" });
    }
  });

  // ─── Amendment Review: Author accepts/rejects an amendment ──────────────────

  app.post("/api/amendments/:id/review", requireAuth, async (req: any, res) => {
    try {
      const amendmentId = parseInt(req.params.id);
      const { decision, reason } = req.body;

      if (!['accepted', 'rejected'].includes(decision)) {
        return res.status(400).json({ message: "Decision must be 'accepted' or 'rejected'" });
      }

      const amendment = await storage.getAmendment(amendmentId);
      if (!amendment) return res.status(404).json({ message: "Amendment not found" });

      // Only the proposal author can review amendments
      const proposal = await storage.getProposal(amendment.proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      if (proposal.authorId !== req.user.id) {
        return res.status(403).json({ message: "Only the proposal author can review amendments" });
      }

      await authorReviewAmendment(amendmentId, decision as 'accepted' | 'rejected', reason);
      res.json({ success: true, decision });
    } catch (error) {
      console.error("Error reviewing amendment:", error);
      res.status(500).json({ message: "Failed to review amendment" });
    }
  });

  // ─── Amendment Review: Community votes on rejected amendments ───────────────

  app.post("/api/amendments/:id/rejection-vote", requireAuth, async (req: any, res) => {
    try {
      const amendmentId = parseInt(req.params.id);
      const { vote } = req.body;

      if (![1, -1].includes(vote)) {
        return res.status(400).json({ message: "Vote must be +1 or -1" });
      }

      const amendment = await storage.getAmendment(amendmentId);
      if (!amendment) return res.status(404).json({ message: "Amendment not found" });

      // Only rejected amendments can be voted on
      if (amendment.authorDecision !== 'rejected') {
        return res.status(400).json({ message: "Only rejected amendments can be voted on" });
      }

      await castRejectionVote(amendmentId, req.user.id, vote as 1 | -1);
      res.json({ success: true });
    } catch (error) {
      console.error("Error casting rejection vote:", error);
      res.status(500).json({ message: "Failed to cast vote" });
    }
  });

  // ─── Amendment Duplicates: Flag overlapping amendments for author review ────

  app.get("/api/proposals/:id/amendments/duplicates", async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      if (!Number.isFinite(proposalId)) {
        return res.status(400).json({ message: "Invalid proposal id" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const thresholdParam = req.query.threshold;
      const threshold = typeof thresholdParam === 'string' ? Number.parseFloat(thresholdParam) : undefined;

      const { findDuplicateAmendments, DEFAULT_SIMILARITY_THRESHOLD } = await import('./utils/amendment-merger');
      const groups = await findDuplicateAmendments(
        proposalId,
        Number.isFinite(threshold as number) ? threshold : DEFAULT_SIMILARITY_THRESHOLD,
      );

      res.json({ proposalId, groups });
    } catch (error) {
      console.error("Error detecting duplicate amendments:", error);
      res.status(500).json({ message: "Failed to detect duplicate amendments" });
    }
  });

  // ─── Community Signal: Get signal data for all rejected amendments ──────────

  app.get("/api/proposals/:id/amendments/signals", async (req, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const signals = await calculateCommunitySignals(proposalId, proposal.communityId);
      res.json(signals);
    } catch (error) {
      console.error("Error fetching community signals:", error);
      res.status(500).json({ message: "Failed to fetch signals" });
    }
  });

  // ─── Sortition Input: Get the sortition synthesis package ───────────────────

  app.get("/api/proposals/:id/sortition-input", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      // Check if user is part of the sortition body for this proposal
      // (simplified check — in production, verify sortition membership)

      const input = await buildSortitionInput(proposalId, proposal.communityId);
      res.json(input);
    } catch (error) {
      console.error("Error fetching sortition input:", error);
      res.status(500).json({ message: "Failed to fetch sortition input" });
    }
  });

  // ─── Sortition: Save final composed text ────────────────────────────────────

  app.post("/api/proposals/:id/final-text", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const { finalText } = req.body;

      if (!finalText) {
        return res.status(400).json({ message: "Final text is required" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      // Check if proposal is in sortition_synthesis state
      if (proposal.status !== 'sortition_synthesis') {
        return res.status(400).json({ message: "Proposal must be in sortition_synthesis state" });
      }

      await saveFinalText(proposalId, finalText);
      res.json({ success: true });
    } catch (error) {
      console.error("Error saving final text:", error);
      res.status(500).json({ message: "Failed to save final text" });
    }
  });

  // ─── Demopolis: Debate Routes ──────────────────────────────────────────────

  // List debate arguments for a proposal
  app.get("/api/proposals/:id/arguments", async (req, res) => {
    try {
      const arguments_ = await storage.getDebateArguments(parseInt(req.params.id));
      res.json(arguments_);
    } catch (error) {
      console.error("Error fetching arguments:", error);
      res.status(500).json({ message: "Failed to fetch arguments" });
    }
  });

  // Create debate argument (authenticated, must be community member)
  app.post("/api/proposals/:id/arguments", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
      
      const isMember = await storage.isCommunityMember(proposal.communityId, req.user.id);
      if (!isMember) return res.status(403).json({ message: "Must be a community member" });

      const { side, text } = req.body;

      if (!side || !text) {
        return res.status(400).json({ message: "Side and text are required" });
      }

      const argument = await storage.createDebateArgument({
        proposalId,
        authorId: req.user.id,
        side,
        text,
      });

      res.status(201).json(argument);
    } catch (error) {
      console.error("Error creating argument:", error);
      res.status(500).json({ message: "Failed to create argument" });
    }
  });

  // Support an argument
  app.post("/api/arguments/:id/support", requireAuth, async (req: any, res) => {
    try {
      const argument = await storage.supportDebateArgument(parseInt(req.params.id), req.user.id);
      res.json(argument);
    } catch (error) {
      console.error("Error supporting argument:", error);
      res.status(500).json({ message: "Failed to support argument" });
    }
  });

  // Oppose an argument
  app.post("/api/arguments/:id/oppose", requireAuth, async (req: any, res) => {
    try {
      const argument = await storage.opposeDebateArgument(parseInt(req.params.id), req.user.id);
      res.json(argument);
    } catch (error) {
      console.error("Error opposing argument:", error);
      res.status(500).json({ message: "Failed to oppose argument" });
    }
  });

  // ─── Demopolis: Proposal Support Routes ────────────────────────────────────

  // Support/oppose a proposal
  app.post("/api/proposals/:id/support", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const { type } = req.body; // 'support' or 'oppose'

      if (!type || !['support', 'oppose'].includes(type)) {
        return res.status(400).json({ message: "Type must be 'support' or 'oppose'" });
      }

      const support = await storage.createProposalSupport(proposalId, req.user.id, type);
      res.status(201).json(support);
    } catch (error) {
      console.error("Error creating support:", error);
      res.status(500).json({ message: "Failed to create support" });
    }
  });

  // Get proposal support counts
  app.get("/api/proposals/:id/support", async (req: any, res) => {
    try {
      const userId = (req.user as any)?.id;
      const support = await storage.getProposalSupport(parseInt(req.params.id), userId);
      res.json(support);
    } catch (error) {
      console.error("Error fetching support:", error);
      res.status(500).json({ message: "Failed to fetch support" });
    }
  });

  // ─── Demopolis: Proposal Final Ratification Vote Routes ────────────────────

  // Cast or update final ratification vote (one per user per proposal).
  // Only allowed while the proposal is in the `voting` lifecycle state.
  app.post("/api/proposals/:id/vote", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      if (!Number.isFinite(proposalId)) {
        return res.status(400).json({ message: "Invalid proposal id" });
      }

      const parsed = castProposalVoteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Choice must be one of 'yes', 'no', 'abstain'",
          errors: parsed.error.flatten(),
        });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      if (proposal.status !== 'voting') {
        return res.status(409).json({
          message: "Proposal is not currently in the voting phase",
          current_status: proposal.status,
        });
      }

      const isMember = await storage.isCommunityMember(proposal.communityId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "Only community members may cast a final vote" });
      }

      const vote = await storage.castProposalVote(proposalId, req.user.id, parsed.data.choice);
      res.status(201).json(vote);
    } catch (error) {
      console.error("Error casting proposal vote:", error);
      res.status(500).json({ message: "Failed to cast vote" });
    }
  });

  // Get aggregated final-vote results for a proposal.
  // Includes the requester's own vote when authenticated.
  app.get("/api/proposals/:id/vote-results", async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      if (!Number.isFinite(proposalId)) {
        return res.status(400).json({ message: "Invalid proposal id" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const results = await storage.getProposalVoteResults(proposalId);
      const userId = (req.user as any)?.id;
      const userVote = userId ? await storage.getUserProposalVote(proposalId, userId) : undefined;

      res.json({
        ...results,
        userVote: userVote?.choice ?? null,
      });
    } catch (error) {
      console.error("Error fetching vote results:", error);
      res.status(500).json({ message: "Failed to fetch vote results" });
    }
  });

  // Finalize the ratification vote and transition the proposal to `decided`
  // (or `archived` if quorum is not met). Author/admin/founder only.
  app.post("/api/proposals/:id/finalize", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      if (!Number.isFinite(proposalId)) {
        return res.status(400).json({ message: "Invalid proposal id" });
      }

      const proposal = await storage.getProposal(proposalId);
      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      if (proposal.status !== 'voting') {
        return res.status(409).json({
          message: "Only proposals in the voting phase can be finalized",
          current_status: proposal.status,
        });
      }

      if (proposal.authorId !== req.user.id) {
        const role = await storage.getCommunityMemberRole(proposal.communityId, req.user.id);
        if (role !== 'admin' && role !== 'founder') {
          return res.status(403).json({ message: "Not authorized to finalize this proposal" });
        }
      }

      const results = await storage.getProposalVoteResults(proposalId);
      const nextState = results.meetsQuorum ? 'decided' : 'archived';

      const { transitionProposal, triggerSideEffects } = await import('./utils/proposal-state-machine');
      const { storage: storageInstance } = await import('./storage');
      const updated = await transitionProposal(proposal, nextState, storageInstance);
      await triggerSideEffects(proposal.status, nextState, updated);

      res.json({ proposal: updated, results });
    } catch (error) {
      console.error("Error finalizing proposal:", error);
      res.status(500).json({ message: "Failed to finalize proposal" });
    }
  });

  // ─── Demopolis: State Machine Routes ───────────────────────────────────────

  // Transition proposal state (author/admin only)
  app.post("/api/proposals/:id/transition", requireAuth, async (req: any, res) => {
    try {
      const proposalId = parseInt(req.params.id);
      const proposal = await storage.getProposal(proposalId);

      if (!proposal) return res.status(404).json({ message: "Proposal not found" });

      const { newState } = req.body;
      if (!isProposalState(newState)) {
        return res.status(400).json({ message: "A valid canonical proposal state is required" });
      }
      if (!isProposalState(proposal.status)) {
        return res.status(409).json({
          message: `Proposal has legacy or invalid status: ${proposal.status}`,
          current_status: proposal.status,
        });
      }

      // Import state machine
      const { transitionProposal, canTransition, getNextStates, triggerSideEffects } = await import('./utils/proposal-state-machine');

      // Validate transition
      if (!canTransition(proposal.status, newState)) {
        const valid = getNextStates(proposal.status);
        return res.status(409).json({
          message: `Invalid transition: ${proposal.status} → ${newState}`,
          valid_transitions: valid,
        });
      }

      // Check permissions
      if (proposal.authorId !== req.user.id) {
        const role = await storage.getCommunityMemberRole(proposal.communityId, req.user.id);
        if (role !== 'admin' && role !== 'founder') {
          return res.status(403).json({ message: "Not authorized" });
        }
      }

      const { storage: storageInstance } = await import('./storage');
      const updated = await transitionProposal(proposal, newState, storageInstance);
      await triggerSideEffects(proposal.status, newState, updated);
      res.json(updated);
    } catch (error) {
      console.error("Error transitioning proposal:", error);
      res.status(500).json({ message: "Failed to transition proposal" });
    }
  });

  // ─── Demopolis: Sortition Routes ──────────────────────────────────────────

  // Create sortition body (admin/founder only)
  app.post("/api/communities/:id/sortition", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const role = await storage.getCommunityMemberRole(communityId, req.user.id);

      if (role !== 'admin' && role !== 'founder') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { size } = req.body;
      const panelSize = size || 7;

      const { createSortitionBody } = await import('./utils/sortition');
      const result = await createSortitionBody(communityId, panelSize, storage);

      // Notify selected members
      try {
        const { notifySortitionMembers } = await import('./utils/notifications');
        const notified = await notifySortitionMembers(
          result.bodyId,
          communityId,
          null,
          72
        );
        console.log(`Notified ${notified} sortition members for body ${result.bodyId}`);
      } catch (notifError) {
        console.error('Failed to send sortition notifications:', notifError);
        // Don't fail the sortition creation if notifications fail
      }

      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating sortition body:", error);
      res.status(500).json({ message: "Failed to create sortition body" });
    }
  });

  // Preview sortition selection (any community member)
  app.get("/api/communities/:id/sortition/preview", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const isMember = await storage.isCommunityMember(communityId, req.user.id);

      if (!isMember) {
        return res.status(403).json({ message: "Must be a community member" });
      }

      const { previewSortition } = await import('./utils/sortition');
      const { size } = req.query;
      const panelSize = parseInt(size as string) || 7;

      const result = await previewSortition(communityId, panelSize, storage);
      res.json(result);
    } catch (error) {
      console.error("Error previewing sortition:", error);
      res.status(500).json({ message: "Failed to preview sortition" });
    }
  });

  // List sortition bodies for a community (admin/founder)
  app.get("/api/communities/:id/sortition", requireAuth, async (req: any, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const role = await storage.getCommunityMemberRole(communityId, req.user.id);

      if (role !== 'admin' && role !== 'founder') {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Get all sortition bodies for this community
      const bodies = await db
        .select()
        .from(sortitionBodies)
        .where(eq(sortitionBodies.communityId, communityId))
        .orderBy(desc(sortitionBodies.createdAt));

      // Enrich with member counts
      const enriched = await Promise.all(
        bodies.map(async (body) => {
          const members = await storage.getSortitionMembers(body.id);
          return {
            ...body,
            memberCount: members.length,
            members: members.map(m => ({ userId: m.userId, scoredAt: m.scoredAt })),
          };
        })
      );

      res.json(enriched);
    } catch (error) {
      console.error("Error listing sortition bodies:", error);
      res.status(500).json({ message: "Failed to list sortition bodies" });
    }
  });

  // Get a specific sortition body with members
  app.get("/api/sortition/:bodyId", requireAuth, async (req: any, res) => {
    try {
      const bodyId = parseInt(req.params.bodyId);
      const body = await storage.getSortitionBody(bodyId);

      if (!body) {
        return res.status(404).json({ message: "Sortition body not found" });
      }

      const members = await storage.getSortitionMembers(bodyId);

      // Get user details for each member
      const enrichedMembers = await Promise.all(
        members.map(async (m) => {
          const user = await storage.getUser(m.userId);
          return {
            ...m,
            user: user ? { id: user.id, name: user.name, username: user.username } : null,
          };
        })
      );

      res.json({
        ...body,
        members: enrichedMembers,
        memberCount: enrichedMembers.length,
      });
    } catch (error) {
      console.error("Error getting sortition body:", error);
      res.status(500).json({ message: "Failed to get sortition body" });
    }
  });

  // Complete a sortition body (admin/founder)
  app.post("/api/sortition/:bodyId/complete", requireAuth, async (req: any, res) => {
    try {
      const bodyId = parseInt(req.params.bodyId);
      const body = await storage.getSortitionBody(bodyId);

      if (!body) {
        return res.status(404).json({ message: "Sortition body not found" });
      }

      // Check if user is admin of the community
      const role = await storage.getCommunityMemberRole(body.communityId, req.user.id);
      if (role !== 'admin' && role !== 'founder') {
        return res.status(403).json({ message: "Not authorized" });
      }

      if (body.status === 'completed') {
        return res.status(400).json({ message: "Sortition body already completed" });
      }

      const completed = await storage.completeSortitionBody(bodyId);
      res.json(completed);
    } catch (error) {
      console.error("Error completing sortition body:", error);
      res.status(500).json({ message: "Failed to complete sortition body" });
    }
  });

  // ─── Demopolis: Sortition Assignment Routes ────────────────────────────────

  // Get sortition assignment details (for scoring page)
  app.get("/api/sortition/assignments/:id", requireAuth, async (req: any, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const member = await db
        .select()
        .from(sortitionMembers)
        .where(eq(sortitionMembers.id, memberId));

      if (!member.length) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const sortMember = member[0];
      const body = await storage.getSortitionBody(sortMember.bodyId);
      if (!body) {
        return res.status(404).json({ message: "Sortition body not found" });
      }

      // Get the proposal being reviewed
      let proposal = null;
      let similarProposals: any[] = [];
      if (body.proposalId) {
        proposal = await storage.getProposal(body.proposalId);
        if (proposal) {
          // Get similar proposals from same community
          const allProposals = await storage.getProposals(body.communityId);
          similarProposals = allProposals
            .filter(p => p.id !== proposal!.id && p.status === proposal!.status)
            .slice(0, 3)
            .map(p => ({
              id: p.id,
              question: p.question,
              state: p.status,
            }));
        }
      }

      res.json({
        id: sortMember.id,
        bodyId: sortMember.bodyId,
        proposalId: body.proposalId,
        proposalQuestion: proposal?.question || "",
        proposalSolution: proposal?.solution || "",
        responseDeadline: body.selectedAt
          ? new Date(new Date(body.selectedAt).getTime() + (body.responseHours || 72) * 60 * 60 * 1000).toISOString()
          : new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        similarProposals,
        responded: sortMember.responded,
      });
    } catch (error) {
      console.error("Error fetching sortition assignment:", error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  // Submit sortition score
  app.post("/api/sortition/assignments/:id/score", requireAuth, async (req: any, res) => {
    try {
      const memberId = parseInt(req.params.id);
      const { score } = req.body;

      const member = await db
        .select()
        .from(sortitionMembers)
        .where(eq(sortitionMembers.id, memberId));

      if (!member.length) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const sortMember = member[0];

      // Verify the user is the assigned member
      if (sortMember.userId !== req.user.id) {
        return res.status(403).json({ message: "Not your assignment" });
      }

      // Update the member with their score
      const [updated] = await db
        .update(sortitionMembers)
        .set({
          score: score ? String(score) : undefined,
          responded: true,
          scoredAt: new Date(),
        })
        .where(and(
          eq(sortitionMembers.bodyId, sortMember.bodyId),
          eq(sortitionMembers.userId, req.user.id)
        ))
        .returning();

      res.json({ success: true, member: updated });
    } catch (error) {
      console.error("Error submitting sortition score:", error);
      res.status(500).json({ message: "Failed to submit score" });
    }
  });

  // Synthesize sortition scores — aggregate and auto-complete
  app.post("/api/sortition/:bodyId/synthesize", requireAuth, async (req: any, res) => {
    try {
      const bodyId = parseInt(req.params.bodyId);
      const body = await storage.getSortitionBody(bodyId);

      if (!body) {
        return res.status(404).json({ message: "Sortition body not found" });
      }

      // Check if user is admin of the community
      const role = await storage.getCommunityMemberRole(body.communityId, req.user.id);
      if (role !== 'admin' && role !== 'founder') {
        return res.status(403).json({ message: "Not authorized" });
      }

      const { synthesizeSortitionScores } = await import('./utils/sortition');
      const result = await synthesizeSortitionScores(bodyId, storage);

      res.json(result);
    } catch (error) {
      console.error("Error synthesizing sortition scores:", error);
      res.status(500).json({ message: "Failed to synthesize scores" });
    }
  });

  // ─── Demopolis: Democracy Score Routes ────────────────────────────────────

  // Get democracy score for a community (public)
  app.get("/api/communities/:id/democracy-score", async (req, res) => {
    try {
      const communityId = parseInt(req.params.id);
      const community = await storage.getCommunity(communityId);

      if (!community) {
        return res.status(404).json({ message: "Community not found" });
      }

      const { calculateDemocracyScore, getDemocracyGrade } = await import('./utils/democracy-score');
      const result = await calculateDemocracyScore(communityId, storage);

      res.json({
        ...result,
        grade: getDemocracyGrade(result.score),
      });
    } catch (error) {
      console.error("Error calculating democracy score:", error);
      res.status(500).json({ message: "Failed to calculate democracy score" });
    }
  });

  // ─── Sortition Notification Routes ──────────────────────────────────────

  // Get user's sortition notifications
  app.get("/api/sortition-notifications", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;
      const unreadOnly = req.query.unread === 'true';

      const result = await db.execute(sql`
        SELECT * FROM sortition_notifications
        WHERE user_id = ${userId}${unreadOnly ? sql` AND read = FALSE` : sql``}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `);

      // Get unread count
      const countResult = await db.execute(sql`
        SELECT COUNT(*) as count FROM sortition_notifications
        WHERE user_id = ${userId} AND read = FALSE
      `);

      res.json({
        notifications: result.rows,
        unreadCount: parseInt(countResult.rows[0]?.count as string) || 0,
        total: result.rows.length,
      });
    } catch (error) {
      console.error("Error fetching sortition notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  // Get unread notification count (lightweight)
  app.get("/api/sortition-notifications/unread-count", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const result = await db.execute(sql`
        SELECT COUNT(*) as count FROM sortition_notifications
        WHERE user_id = ${userId} AND read = FALSE
      `);
      res.json({ count: parseInt(result.rows[0]?.count as string) || 0 });
    } catch (error) {
      console.error("Error fetching unread count:", error);
      res.status(500).json({ message: "Failed to fetch unread count" });
    }
  });

  // Mark single notification as read
  app.post("/api/sortition-notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const notificationId = parseInt(req.params.id);

      // Verify ownership
      const existing = await db.execute(sql`
        SELECT user_id FROM sortition_notifications WHERE id = ${notificationId}
      `);

      if (existing.rows.length === 0) {
        return res.status(404).json({ message: "Notification not found" });
      }
      if ((existing.rows[0].user_id as number) !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      await db.execute(sql`
        UPDATE sortition_notifications SET read = TRUE, read_at = NOW() WHERE id = ${notificationId}
      `);

      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark as read" });
    }
  });

  // Mark all notifications as read
  app.post("/api/sortition-notifications/mark-all-read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      await db.execute(sql`
        UPDATE sortition_notifications SET read = TRUE, read_at = NOW()
        WHERE user_id = ${userId} AND read = FALSE
      `);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all as read:", error);
      res.status(500).json({ message: "Failed to mark all as read" });
    }
  });

  // Get notification preferences
  app.get("/api/notification-preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { getOrCreatePreferences } = await import('./utils/notifications');
      const prefs = await getOrCreatePreferences(userId);
      res.json(prefs);
    } catch (error) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  // Update notification preferences
  app.patch("/api/notification-preferences", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user!.id;
      const { updatePreferences } = await import('./utils/notifications');
      await updatePreferences(userId, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // ─── End Sortition Notification Routes ──────────────────────────────────

  const httpServer = createServer(app);

  return httpServer;
}
