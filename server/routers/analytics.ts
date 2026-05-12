/**
 * Analytics Router
 *
 * Handles analytics routes.
 */

import type { Express, Request, Response } from 'express';
import { storage } from '../storage';

export function registerAnalyticsRoutes(app: Express): void {
  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const overview = await storage.getAnalyticsOverview();
      res.json(overview);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch analytics overview" });
    }
  });
  app.get("/api/analytics/poll-popularity", async (req, res) => {
    try {
      const popularity = await storage.getPollPopularityStats();
      res.json(popularity);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch poll popularity data" });
    }
  });
  app.get("/api/analytics/activity-trends", async (req, res) => {
    try {
      const trends = await storage.getActivityTrends();
      res.json(trends);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch activity trends" });
    }
  });
  app.get("/api/analytics/usage-patterns", async (req, res) => {
    try {
      const patterns = await storage.getUsagePatterns();
      res.json(patterns);
    } catch (error: any) {
      res.status(500).json({ error: "Failed to fetch usage patterns" });
    }
  });
}