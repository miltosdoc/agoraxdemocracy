/**
 * Users Router
 *
 * Handles users routes.
 */

import type { Express, Request, Response } from 'express';
import multer from 'multer';
import { userRepo } from '../storage';
import { requireAuth } from '../auth';
import { verifyLocationSchema, locationSchema } from '../utils/location-validator';
import { ballotUpload } from '../utils/ballot-client';
import { requireAdmin } from '../auth';

export function registerUsersRoutes(app: Express): void {
  app.patch("/api/user/verify-location", requireAuth, async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ message: "Δεν είστε συνδεδεμένοι" });
      }
      const parsedData = verifyLocationSchema(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα επαλήθευσης",
          errors: JSON.stringify(parsedData.error || "Validation failed")
        });
      }
      // Update the user's location verification status
      const updated = await userRepo.verifyUserLocation(userId, parsedData.data.verified);
      // If verification is false, reset the location confirmation as well
      if (!parsedData.data.verified) {
        await userRepo.updateUserLocation(userId, {
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
      const parsedData = verifyLocationSchema(req.body);
      if (!parsedData.success) {
        return res.status(400).json({
          message: "Λανθασμένα δεδομένα τοποθεσίας",
          errors: JSON.stringify(parsedData.error || "Validation failed")
        });
      }
      const updatedUser = await userRepo.updateUserLocation(userId, parsedData.data);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της τοποθεσίας" });
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
  app.post("/api/user/verify-govgr", requireAuth, multer({ storage: multer.memoryStorage() }).single('file'), async (req: any, res) => {
    try {
      const file = req.file;
      if (!file) {
        return res.status(400).json({ message: "PDF file is required" });
      }
      // Verify identity via Python ballot service
      const { verifyIdentity } = await import('../utils/ballot-client');
      const result = await verifyIdentity(file.buffer);
      if (result.success) {
        // Check if this voter hash is already used by another account
        const voterHash = result.voter_hash || "";
        if (voterHash) {
          const existingUser = await userRepo.getUserByVoterHash(voterHash);
          if (existingUser && existingUser.id !== req.user.id) {
            return res.status(400).json({
              success: false,
              message: "Αυτή η ταυτότητα είναι ήδη συνδεδεμένη με άλλο λογαριασμό",
              rejection_reason: "already_verified"
            });
          }
        }
        // Update user record with verification info
        await userRepo.updateUser(req.user.id, {
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
}