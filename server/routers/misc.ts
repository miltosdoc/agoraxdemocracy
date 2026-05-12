/**
 * Misc Router
 *
 * Handles misc routes.
 */

import type { Express, Request, Response } from 'express';
import { storage } from '../storage';
import { requireAuth } from '../auth';
import { db } from '../db';

export function registerMiscRoutes(app: Express): void {
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
  app.get("/api/health", async (req, res) => {
    try {
      const { db } = await import('../db');
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
  // Legacy poll/survey HTTP routes have been retired — proposals are the
  // canonical civic surface. The poll storage methods remain because the
  // social-bot HTML preview route above still resolves poll metadata for
  // shared links that predate the migration.
}