/**
 * Platform Router
 *
 * Handles platform routes.
 */

import type { Express, Request, Response } from 'express';
import { platformRepo } from '../storage';
import { requireAuth } from '../auth';

export function registerPlatformRoutes(app: Express): void {
  // Get platform settings
  app.get("/api/platform-settings", requireAuth, async (req: Request, res: Response) => {
    try {
      const settings = await platformRepo.getPlatformSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to get platform settings" });
    }
  });
  // Update platform settings handler
  const updatePlatformSettingHandler = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user!.id;
      const { key, value } = req.body;
      if (!key || value === undefined || value === null) {
        return res.status(400).json({ message: "key and value are required" });
      }
      const setting = await platformRepo.updatePlatformSetting(key, String(value), userId);
      res.json(setting);
    } catch (error) {
      res.status(500).json({ message: "Failed to update platform setting" });
    }
  };
  app.put("/api/platform-settings", requireAuth, updatePlatformSettingHandler);
  app.patch("/api/platform-settings", requireAuth, updatePlatformSettingHandler);
  // Search members and communities
  app.get("/api/search", requireAuth, async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      if (!query) {
        return res.json({ members: [], communities: [] });
      }
      const [members, communities] = await Promise.all([
        platformRepo.searchMembers(query, limit),
        platformRepo.searchCommunities(query, limit),
      ]);
      res.json({
        members: members.map(m => ({
          id: m.id,
          username: m.username,
          profilePicture: m.profilePicture,
        })),
        communities: communities.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description,
        })),
      });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });
}