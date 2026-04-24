     1|import type { Express } from "express";
     2|import { createServer, type Server } from "http";
     3|import { storage } from "./storage";
     4|import { setupAuth } from "./auth";
     5|import { updatePollLocations } from "./update-poll-locations";
     6|import {
     7|  createPollSchema,
     8|  createSurveyPollSchema,
     9|  insertVoteSchema,
    10|  rankingVoteSchema,
    11|  insertCommentSchema,
    13|  users,
    14|  votes,
    15|  insertPollUserResponseSchema,
    16|  sortitionMembers,
    17|} from "@shared/schema";
    18|import { z } from "zod";
    19|import { db } from "./db";
    20|import { eq, and, desc, asc, sql } from "drizzle-orm";
    21|import {
    22|  authorReviewAmendment,
    23|  castRejectionVote,
    24|  calculateCommunitySignals,
    25|  buildSortitionInput,
    26|  saveFinalText,
    27|} from "./utils/amendment-processor";
    28|
    30|  email: z.string().email("Invalid email format")
    31|});
    32|
    33|/**
    34| * Helper function to format Zod validation errors in a more user-friendly way.
    35| * 
    36| * @param errors The raw Zod validation errors
    37| * @returns A more user-friendly error object
    38| */
    39|function formatValidationErrors(errors: Record<string, any>): Record<string, any> {
    40|  const formattedErrors: Record<string, any> = {};
    41|
    42|  // Helper function to recursively process errors
    43|  function processErrors(obj: Record<string, any>, path: string = "") {
    44|    for (const key in obj) {
    45|      const fullPath = path ? `${path}.${key}` : key;
    46|
    47|      if (key === "_errors" && Array.isArray(obj[key])) {
    48|        if (obj[key].length > 0) {
    49|          // We have actual error messages here
    50|          let location = path;
    51|          if (location === "") {
    52|            location = "general";
    53|          }
    54|
    55|          if (!formattedErrors[location]) {
    56|            formattedErrors[location] = [];
    57|          }
    58|
    59|          // Add all error messages for this field
    60|          for (const error of obj[key]) {
    61|            formattedErrors[location].push(error);
    62|          }
    63|        }
    64|      } else if (typeof obj[key] === "object" && obj[key] !== null) {
    65|        // Recursively process nested objects
    66|        processErrors(obj[key], fullPath);
    67|      }
    68|    }
    69|  }
    70|
    71|  processErrors(errors);
    72|
    73|  // Special case for optionId which is often required in votes
    74|  if (errors.optionId?._errors?.includes("Required")) {
    75|    formattedErrors.optionId = ["Παρακαλώ επιλέξτε μια επιλογή"];
    76|  }
    77|
    78|  return formattedErrors;
    79|}
    80|
    81|export async function registerRoutes(app: Express): Promise<Server> {
    82|
    83|  // Setup authentication routes
    84|  setupAuth(app);
    85|
    86|  // Consolidated route for /polls/:id with social bot detection
    87|  app.get("/polls/:id", async (req, res, next) => {
    88|    const userAgent = req.get('User-Agent') || '';
    89|
    90|    // Detect social media crawlers and preview bots
    91|    const isSocialBot = /facebookexternalhit|twitterbot|linkedinbot|whatsapp|telegrambot|skypeuripreview|slackbot|discordbot/i.test(userAgent);
    92|
    93|    if (!isSocialBot) {
    94|      // Regular users - let frontend handle this route
    95|      return next();
    96|    }
    97|
    98|    // Social bots - serve SEO-optimized HTML with Open Graph tags
    99|    try {
   100|      const pollId = parseInt(req.params.id);
   101|      const poll = await storage.getPoll(pollId);
   102|
   103|      if (!poll) {
   104|        return next(); // Let frontend handle 404
   105|      }
   106|
   107|      const results = await storage.getPollResults(pollId);
   108|      const totalVotes = results.reduce((sum, result) => sum + result.voteCount, 0);
   109|      const isActive = new Date(poll.endDate) > new Date();
   110|
   111|      // Clean description without HTML tags
   112|      const cleanDescription = poll.description
   113|        ? poll.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
   114|        : '';
   115|
   116|      // Optimized description for social sharing
   117|      const shareDescription = cleanDescription
   118|        ? `${cleanDescription.substring(0, 150)}... 🗳️ Ψηφίστε στο AgoraX!`
   119|        : `🗳️ Συμμετέχετε στην ψηφοφορία και εκφράστε τη γνώμη σας!`;
   120|
   121|      const pollUrl = `${req.protocol}://${req.get('host')}/polls/${pollId}`;
   122|      const ogImage = `${req.protocol}://${req.get('host')}/api/og-image/${pollId}?v=3`;
   123|
   124|      const html = `<!DOCTYPE html>
   125|<html lang="el">
   126|<head>
   127|    <meta charset="UTF-8">
   128|    <meta name="viewport" content="width=device-width, initial-scale=1.0">
   129|    <title>${poll.title} - AgoraX</title>
   130|    
   131|    <!-- Open Graph / Facebook -->
   132|    <meta property="og:type" content="article">
   133|    <meta property="og:url" content="${pollUrl}">
   134|    <meta property="og:title" content="${poll.title}">
   135|    <meta property="og:description" content="${shareDescription}">
   136|    <meta property="og:image" content="${ogImage}">
   137|    <meta property="og:image:width" content="1200">
   138|    <meta property="og:image:height" content="630">
   139|    <meta property="og:image:type" content="image/png">
   140|    <meta property="og:site_name" content="AgoraX">
   141|    
   142|    <!-- Twitter -->
   143|    <meta name="twitter:card" content="summary_large_image">
   144|    <meta name="twitter:title" content="${poll.title}">
   145|    <meta name="twitter:description" content="${shareDescription}">
   146|    <meta name="twitter:image" content="${ogImage}">
   147|    
   148|    <meta name="description" content="${shareDescription}">
   149|</head>
   150|<body>
   151|    <div style="font-family: Arial; max-width: 600px; margin: 2rem auto; padding: 2rem;">
   152|        <h1>${poll.title}</h1>
   153|        <p>${cleanDescription}</p>
   154|        <p>Κατηγορία: ${poll.category} • Ψήφοι: ${totalVotes} • ${isActive ? 'Ενεργή' : 'Κλειστή'}</p>
   155|        <a href="${pollUrl}" style="background: #2563eb; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 6px; display: inline-block;">Δείτε την ψηφοφορία</a>
   156|    </div>
   157|</body>
   158|</html>`;
   159|
   160|      res.send(html);
   161|    } catch (error) {
   162|      console.error("Error generating bot HTML:", error);
   163|      next();
   164|    }
   165|  });
   166|
   167|  // Open Graph image generation for social media previews (minimal design with logo)
   168|  app.get("/api/og-image/:id", async (req, res) => {
   169|    try {
   170|      const pollId = parseInt(req.params.id);
   171|      const poll = await storage.getPoll(pollId);
   172|
   173|      if (!poll) {
   174|        return res.status(404).send("Poll not found");
   175|      }
   176|
   177|      const { createCanvas, loadImage } = await import('canvas');
   178|      const path = await import('path');
   179|
   180|      // Standard OpenGraph size: 1200x630
   181|      const width = 1200;
   182|      const height = 630;
   183|      const canvas = createCanvas(width, height);
   184|      const ctx = canvas.getContext('2d');
   185|
   186|      // Clean white background
   187|      ctx.fillStyle = '#ffffff';
   188|      ctx.fillRect(0, 0, width, height);
   189|
   190|      // Load and draw logo (centered)
   191|      try {
   192|        const logoPath = path.resolve(process.cwd(), 'client/public/logo-share.png');
   193|        const logo = await loadImage(logoPath);
   194|        const logoSize = 200;
   195|        const logoX = (width - logoSize) / 2;
   196|        const logoY = (height - logoSize) / 2;
   197|        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);
   198|      } catch (err) {
   199|        // If logo fails to load, show AgoraX text instead
   200|        ctx.fillStyle = '#1e293b';
   201|        ctx.font = 'bold 64px Arial';
   202|        ctx.textAlign = 'center';
   203|        ctx.fillText('AgoraX', width / 2, height / 2);
   204|      }
   205|
   206|      // Convert to PNG buffer
   207|      const pngBuffer = canvas.toBuffer('image/png');
   208|
   209|      // Serve PNG with caching headers
   210|      res.setHeader('Content-Type', 'image/png');
   211|      res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
   212|      res.setHeader('Access-Control-Allow-Origin', '*');
   213|      res.setHeader('Content-Disposition', 'inline; filename="poll-preview.png"');
   214|      res.send(pngBuffer);
   215|
   216|    } catch (error) {
   217|      console.error("Error generating OG image:", error);
   218|      res.status(500).send("Error generating image");
   219|    }
   220|  });
   221|
   222|  // Protected route middleware
   223|  const requireAuth = (req: any, res: any, next: any) => {
   224|    // Demo mode: bypass auth, use user 3 (maria) as demo user — author of proposal 1
   225|    if (process.env.DEMO_MODE === 'true') {
   226|      if (!req.user) {
   227|        req.user = { id: 3, username: 'demo', email: 'demo@agorax.gr', name: 'Demo User', isAdmin: true };
   228|        req.isAuthenticated = () => true;
   229|      }
   230|      return next();
   231|    }
   232|    if (!req.isAuthenticated()) {
   233|      return res.status(401).json({ message: "Unauthorized" });
   234|    }
   235|    next();
   236|  };
   237|
   238|  // Poll routes
   239|  app.get("/api/polls", async (req, res) => {
   240|    try {
   241|      const {
   242|        status,
   243|        category,
   244|        sort,
   245|        page = "1",
   246|        pageSize = "9",
   247|        locationScope,
   248|        locationCountry,
   249|        locationRegion,
   250|        locationCity,
   251|        communityId
   252|      } = req.query;
   253|
   254|      const filters = {
   255|        status: status as string,
   256|        category: category as string,
   257|        sort: sort as string,
   258|        page: parseInt(page as string),
   259|        pageSize: parseInt(pageSize as string),
   260|        userId: req.isAuthenticated() ? req.user.id : undefined,
   261|        locationScope: locationScope as string,
   262|        locationCountry: locationCountry as string,
   263|        locationRegion: locationRegion as string,
   264|        locationCity: locationCity as string,
   265|        communityId: communityId ? parseInt(communityId as string) : undefined
   266|      };
   267|
   268|      const polls = await storage.getPolls(filters);
   269|      res.json(polls);
   270|    } catch (error) {
   271|      console.error("Error fetching polls:", error);
   272|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση ψηφοφοριών" });
   273|    }
   274|  });
   275|
   276|  app.get("/api/polls/my", requireAuth, async (req, res) => {
   277|    try {
   278|      const userId = req.user.id;
   279|      const polls = await storage.getUserPolls(userId);
   280|      res.json(polls);
   281|    } catch (error) {
   282|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των ψηφοφοριών σας" });
   283|    }
   284|  });
   285|
   286|  app.get("/api/polls/participated", requireAuth, async (req, res) => {
   287|    try {
   288|      const userId = req.user.id;
   289|      const polls = await storage.getParticipatedPolls(userId);
   290|      res.json(polls);
   291|    } catch (error) {
   292|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των συμμετοχών σας" });
   293|    }
   294|  });
   295|
   296|  app.get("/api/polls/:id", async (req, res) => {
   297|    try {
   298|      const pollId = parseInt(req.params.id);
   299|      const userId = req.isAuthenticated() ? req.user.id : undefined;
   300|      const poll = await storage.getPoll(pollId, userId);
   301|
   302|      if (!poll) {
   303|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   304|      }
   305|
   306|      res.json(poll);
   307|    } catch (error) {
   308|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση της ψηφοφορίας" });
   309|    }
   310|  });
   311|
   312|  app.post("/api/polls", requireAuth, async (req, res) => {
   313|    try {
   314|      console.log("Creating poll with data:", JSON.stringify(req.body, null, 2));
   315|
   316|      const parsedData = createPollSchema.safeParse(req.body);
   317|
   318|      if (!parsedData.success) {
   319|        console.log("Poll data validation failed:", parsedData.error.format());
   320|        return res.status(400).json({
   321|          message: "Λανθασμένα δεδομένα ψηφοφορίας",
   322|          errors: parsedData.error.format()
   323|        });
   324|      }
   325|
   326|      console.log("Parsed poll data:", JSON.stringify(parsedData.data, null, 2));
   327|      const { poll, options } = parsedData.data;
   328|      const creatorId = req.user.id;
   329|
   330|      console.log("Creating poll with creator:", creatorId);
   331|      console.log("Poll object:", JSON.stringify({ ...poll, creatorId }, null, 2));
   332|      console.log("Options:", JSON.stringify(options, null, 2));
   333|
   334|      try {
   335|        const createdPoll = await storage.createPoll({
   336|          ...poll,
   337|          creatorId
   338|        }, options);
   339|
   340|        // Notify group members if poll is in a group
   341|        if (createdPoll.communityId) {
   342|          try {
   343|            const group = await storage.getGroup(createdPoll.communityId);
   344|            if (group && group.members) {
   345|              // Create notifications for all group members except the creator
   346|              const notificationPromises = group.members
   347|                .filter(member => member.userId !== creatorId)
   348|                .map(member =>
   349|                  storage.createPollNotification({
   350|                    userId: member.userId,
   351|                    pollId: createdPoll.id
   352|                  })
   353|                );
   354|
   355|              await Promise.all(notificationPromises);
   356|              console.log(`Created ${notificationPromises.length} notifications for poll ${createdPoll.id}`);
   357|            }
   358|          } catch (notificationError) {
   359|            console.error("Error creating notifications:", notificationError);
   360|          }
   361|        }
   362|
   363|        res.status(201).json(createdPoll);
   364|      } catch (storageError) {
   365|        console.error("Error in storage.createPoll:", storageError);
   366|        throw storageError;
   367|      }
   368|    } catch (error) {
   369|      console.error("Error creating poll:", error);
   370|      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία ψηφοφορίας", error: String(error) });
   371|    }
   372|  });
   373|
   374|  app.patch("/api/polls/:id", requireAuth, async (req, res) => {
   375|    try {
   376|      const pollId = parseInt(req.params.id);
   377|      const userId = req.user.id;
   378|
   379|      console.log("Poll update request received for poll ID:", pollId);
   380|      console.log("Update data:", JSON.stringify(req.body, null, 2));
   381|
   382|      // Check if user is the creator
   383|      const poll = await storage.getPoll(pollId);
   384|      if (!poll) {
   385|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   386|      }
   387|
   388|      if (poll.creatorId !== userId) {
   389|        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεξεργαστείτε αυτή την ψηφοφορία" });
   390|      }
   391|
   392|      // Handle empty strings in numeric fields to avoid database errors
   393|      const updates = { ...req.body };
   394|
   395|      // Remove creatorId from updates to preserve the original creator
   396|      // This prevents foreign key constraint issues
   397|      delete updates.creatorId;
   398|
   399|      // Special handling for description - must be at least empty string, not null
   400|      if (updates.description === '' || updates.description === null) {
   401|        updates.description = ''; // Empty string instead of null to satisfy not-null constraint
   402|      }
   403|
   404|      // Fix potential issues with empty coordinate strings
   405|      if (updates.centerLat === '') updates.centerLat = null;
   406|      if (updates.centerLng === '') updates.centerLng = null;
   407|      if (updates.radiusKm === '') updates.radiusKm = null;
   408|
   409|      // Handle empty location strings
   410|      if (updates.locationCity === '') updates.locationCity = null;
   411|      if (updates.locationRegion === '') updates.locationRegion = null;
   412|      if (updates.locationCountry === '') updates.locationCountry = null;
   413|
   414|      // Fix date fields - convert to proper Date objects
   415|      if (updates.startDate && typeof updates.startDate === 'string') {
   416|        updates.startDate = new Date(updates.startDate);
   417|      }
   418|      if (updates.endDate && typeof updates.endDate === 'string') {
   419|        updates.endDate = new Date(updates.endDate);
   420|      }
   421|
   422|      // Clean up empty string values to avoid database errors
   423|      // But exclude description field which needs to remain an empty string
   424|      Object.keys(updates).forEach(key => {
   425|        if (key !== 'description' && updates[key] === '') {
   426|          updates[key] = null;
   427|        }
   428|      });
   429|
   430|      console.log("Processed updates:", JSON.stringify(updates, null, 2));
   431|
   432|      const updatedPoll = await storage.updatePoll(pollId, updates);
   433|      res.json(updatedPoll);
   434|    } catch (error) {
   435|      console.error("Error updating poll:", error);
   436|      res.status(500).json({ message: "Σφάλμα κατά την ενημέρωση της ψηφοφορίας", error: error.message });
   437|    }
   438|  });
   439|
   440|  app.delete("/api/polls/:id", requireAuth, async (req, res) => {
   441|    try {
   442|      const pollId = parseInt(req.params.id);
   443|      const userId = req.user.id;
   444|
   445|      // Check if user is the creator
   446|      const poll = await storage.getPoll(pollId, userId);
   447|      if (!poll) {
   448|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   449|      }
   450|
   451|      if (poll.creatorId !== userId) {
   452|        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να διαγράψετε αυτή την ψηφοφορία" });
   453|      }
   454|
   455|      // Check if the poll has more than 100 participants
   456|      const participantCount = await storage.getPollParticipantCount(pollId);
   457|      if (participantCount > 100) {
   458|        return res.status(403).json({
   459|          message: "Δεν μπορείτε να διαγράψετε μια ψηφοφορία με πάνω από 100 συμμετέχοντες",
   460|          canSetCommunity: true // Indicate that community mode is an option
   461|        });
   462|      }
   463|
   464|      const result = await storage.deletePoll(pollId);
   465|      if (result) {
   466|        res.json({ success: true, message: "Η ψηφοφορία διαγράφηκε επιτυχώς" });
   467|      } else {
   468|        res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
   469|      }
   470|    } catch (error) {
   471|      console.error("Error deleting poll:", error);
   472|      res.status(500).json({ message: "Σφάλμα κατά τη διαγραφή της ψηφοφορίας" });
   473|    }
   474|  });
   475|
   476|  // Endpoint to set poll to community mode (removing creator association)
   477|  app.patch("/api/polls/:id/community", requireAuth, async (req, res) => {
   478|    try {
   479|      const pollId = parseInt(req.params.id);
   480|      const userId = req.user.id;
   481|
   482|      // Check if user is the creator
   483|      const poll = await storage.getPoll(pollId, userId);
   484|      if (!poll) {
   485|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   486|      }
   487|
   488|      if (poll.creatorId !== userId) {
   489|        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να μεταφέρετε αυτή την ψηφοφορία" });
   490|      }
   491|
   492|      // Update the poll to community mode
   493|      const updatedPoll = await storage.updatePoll(pollId, { communityMode: true });
   494|      res.json({ success: true, message: "Η ψηφοφορία μεταφέρθηκε στην κοινότητα", poll: updatedPoll });
   495|    } catch (error) {
   496|      console.error("Error setting poll to community mode:", error);
   497|      res.status(500).json({ message: "Σφάλμα κατά τη μεταφορά της ψηφοφορίας" });
   498|    }
   499|  });
   500|
   501|  app.patch("/api/polls/:id/extend", requireAuth, async (req, res) => {
   502|    try {
   503|      const pollId = parseInt(req.params.id);
   504|      const userId = req.user.id;
   505|      const { newEndDate } = req.body;
   506|
   507|      if (!newEndDate) {
   508|        return res.status(400).json({ message: "Απαιτείται νέα ημερομηνία λήξης" });
   509|      }
   510|
   511|      // Check if user is the creator
   512|      const poll = await storage.getPoll(pollId, userId);
   513|      if (!poll) {
   514|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   515|      }
   516|
   517|      if (poll.creatorId !== userId) {
   518|        return res.status(403).json({ message: "Δεν έχετε δικαίωμα να επεκτείνετε αυτή την ψηφοφορία" });
   519|      }
   520|
   521|      if (!poll.allowExtension) {
   522|        return res.status(400).json({ message: "Η επέκταση δεν επιτρέπεται για αυτή την ψηφοφορία" });
   523|      }
   524|
   525|      if (!poll.isActive) {
   526|        return res.status(400).json({ message: "Δεν μπορείτε να επεκτείνετε μια ολοκληρωμένη ψηφοφορία" });
   527|      }
   528|
   529|      const updatedPoll = await storage.extendPollDuration(pollId, new Date(newEndDate));
   530|      res.json(updatedPoll);
   531|    } catch (error) {
   532|      res.status(500).json({ message: "Σφάλμα κατά την επέκταση της ψηφοφορίας" });
   533|    }
   534|  });
   535|
   536|  app.post("/api/polls/:id/vote", requireAuth, async (req, res) => {
   537|    try {
   538|      const pollId = parseInt(req.params.id);
   539|      const userId = req.user.id;
   540|
   541|      // Check if poll exists and is active
   542|      const poll = await storage.getPoll(pollId, userId);
   543|      if (!poll) {
   544|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   545|      }
   546|
   547|      // SECURITY: Group membership check for voting
   548|      if (poll.communityId) {
   549|        const isMember = await storage.isGroupMember(poll.communityId, userId);
   550|        if (!isMember) {
   551|          return res.status(403).json({ message: "You must be a member of this group to vote" });
   552|        }
   553|      }
   554|
   555|      if (!poll.isActive) {
   556|        return res.status(400).json({ message: "Η ψηφοφορία έχει ολοκληρωθεί" });
   557|      }
   558|
   559|      // Get user data to check location eligibility
   560|      const user = await storage.getUser(userId);
   561|      if (!user) {
   562|        return res.status(404).json({ message: "Χρήστης δεν βρέθηκε" });
   563|      }
   564|
   565|      // Check for Gov.gr verification - MANDATORY for all votes
   566|      if (!user.govgrVerified) {
   567|        return res.status(403).json({
   568|          message: "Απαιτείται επαλήθευση ταυτότητας Gov.gr για να ψηφίσετε. Παρακαλώ επαληθεύστε την ταυτότητά σας πρώτα."
   569|        });
   570|      }
   571|
   572|      // Debug logging for location data
   573|      console.log(`[VOTE] User location data for user ID ${userId}:`, {
   574|        city: user.city,
   575|        region: user.region,
   576|        country: user.country,
   577|        city_id: user.city_id,
   578|        region_id: user.region_id,
   579|        country_id: user.country_id
   580|      });
   581|
   582|      console.log(`[VOTE] Poll location restrictions:`, {
   583|        locationScope: poll.locationScope,
   584|        locationCity: poll.locationCity,
   585|        locationRegion: poll.locationRegion,
   586|        locationCountry: poll.locationCountry
   587|      });
   588|
   589|      // Import the location validator
   590|      const { isUserEligibleForPoll } = await import('./utils/location-validator');
   591|
   592|      // Check if user is eligible to vote based on location restrictions
   593|      const eligibility = isUserEligibleForPoll(poll, user);
   594|      console.log(`[VOTE] Eligibility result:`, eligibility);
   595|
   596|      if (!eligibility.isEligible) {
   597|        return res.status(403).json({
   598|          message: eligibility.message || "Δεν επιτρέπεται να ψηφίσετε λόγω περιορισμών τοποθεσίας"
   599|        });
   600|      }
   601|
   602|      // Check if user already voted
   603|      const hasVoted = await storage.hasUserVoted(pollId, userId);
   604|      console.log(`[VOTE] User ${userId} has voted: ${hasVoted}`);
   605|
   606|      // If they already voted, check if they can edit their vote
   607|      if (hasVoted) {
   608|        // Check if vote can be edited (within 60 minutes)
   609|        const canEdit = await storage.canEditVote(pollId, userId);
   610|        console.log(`[VOTE] Can edit vote: ${canEdit}`);
   611|        if (!canEdit) {
   612|          return res.status(403).json({
   613|            message: "Δεν μπορείτε να αλλάξετε την ψήφο σας μετά από 60 λεπτά",
   614|            canEdit: false
   615|          });
   616|        }
   617|
   618|        // Delete the existing vote before creating a new one
   619|        console.log(`[VOTE] Deleting existing votes for user ${userId} on poll ${pollId}`);
   620|        await db.delete(votes).where(
   621|          and(
   622|            eq(votes.pollId, pollId),
   623|            eq(votes.userId, userId)
   624|          )
   625|        );
   626|
   627|        // The vote will be recreated below
   628|      }
   629|
   630|      // Handle different poll types
   631|      if (poll.pollType === 'ranking') {
   632|        // For ranking polls, validate with rankingVoteSchema
   633|        const validateRankingVote = rankingVoteSchema.safeParse({
   634|          ...req.body,
   635|          pollId,
   636|          userId
   637|        });
   638|
   639|        if (!validateRankingVote.success) {
   640|          // Format the validation errors to be more user-friendly
   641|          const formattedErrors = formatValidationErrors(validateRankingVote.error.format());
   642|
   643|          return res.status(400).json({
   644|            message: "Λανθασμένα δεδομένα κατάταξης",
   645|            errors: formattedErrors,
   646|            errorType: "validation" // Indicate that these are validation errors
   647|          });
   648|        }
   649|
   650|        const vote = await storage.createVote(validateRankingVote.data);
   651|        return res.status(201).json({
   652|          ...vote,
   653|          isEdit: hasVoted
   654|        });
   655|      } else {
   656|        // For regular polls, handle both single choice and multiple choice
   657|        console.log("Received vote data:", req.body);
   658|        console.log("Vote data for validation:", { ...req.body, pollId, userId });
   659|
   660|        // Check if this is a multiple choice vote (has optionIds array)
   661|        if (req.body.optionIds && Array.isArray(req.body.optionIds)) {
   662|          // Multiple choice voting - create separate votes for each option
   663|          const votes = [];
   664|
   665|          for (const optionId of req.body.optionIds) {
   666|            const validateVote = insertVoteSchema.safeParse({
   667|              optionId,
   668|              pollId,
   669|              userId,
   670|              comment: req.body.comment
   671|            });
   672|
   673|            if (!validateVote.success) {
   674|              const formattedErrors = formatValidationErrors(validateVote.error.format());
   675|              console.log("Vote validation failed for option", optionId, ":", validateVote.error);
   676|
   677|              return res.status(400).json({
   678|                message: "Λανθασμένα δεδομένα ψήφου",
   679|                errors: formattedErrors,
   680|                errorType: "validation"
   681|              });
   682|            }
   683|
   684|            const vote = await storage.createVote(validateVote.data);
   685|            votes.push(vote);
   686|          }
   687|
   688|          return res.status(201).json({
   689|            votes,
   690|            isEdit: hasVoted,
   691|            count: votes.length
   692|          });
   693|        } else {
   694|          // Single choice voting
   695|          const validateVote = insertVoteSchema.safeParse({
   696|            ...req.body,
   697|            pollId,
   698|            userId
   699|          });
   700|
   701|          if (!validateVote.success) {
   702|            const formattedErrors = formatValidationErrors(validateVote.error.format());
   703|            console.log("Vote validation failed:", validateVote.error);
   704|            console.log("Formatted errors:", formattedErrors);
   705|
   706|            return res.status(400).json({
   707|              message: "Λανθασμένα δεδομένα ψήφου",
   708|              errors: formattedErrors,
   709|              errorType: "validation"
   710|            });
   711|          }
   712|
   713|          const vote = await storage.createVote(validateVote.data);
   714|          return res.status(201).json({
   715|            ...vote,
   716|            isEdit: hasVoted
   717|          });
   718|        }
   719|      }
   720|    } catch (error) {
   721|      console.error("Vote submission error:", error);
   722|      res.status(500).json({ message: "Σφάλμα κατά την υποβολή ψήφου" });
   723|    }
   724|  });
   725|
   726|  app.get("/api/polls/:id/results", async (req, res) => {
   727|    try {
   728|      const pollId = parseInt(req.params.id);
   729|      const results = await storage.getPollResults(pollId);
   730|      res.json(results);
   731|    } catch (error) {
   732|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση των αποτελεσμάτων" });
   733|    }
   734|  });
   735|
   736|  app.post("/api/polls/:id/comments", requireAuth, async (req, res) => {
   737|    try {
   738|      const pollId = parseInt(req.params.id);
   739|      const userId = req.user.id;
   740|
   741|      const validateComment = insertCommentSchema.safeParse({
   742|        ...req.body,
   743|        pollId,
   744|        userId
   745|      });
   746|
   747|      if (!validateComment.success) {
   748|        return res.status(400).json({
   749|          message: "Λανθασμένα δεδομένα σχολίου",
   750|          errors: validateComment.error.format()
   751|        });
   752|      }
   753|
   754|      // Check if poll exists and allows comments
   755|      const poll = await storage.getPoll(pollId);
   756|      if (!poll) {
   757|        return res.status(404).json({ message: "Η ψηφοφορία δεν βρέθηκε" });
   758|      }
   759|
   760|      if (!poll.allowComments) {
   761|        return res.status(400).json({ message: "Τα σχόλια δεν επιτρέπονται σε αυτή την ψηφοφορία" });
   762|      }
   763|
   764|      const comment = await storage.createComment(validateComment.data);
   765|      res.status(201).json(comment);
   766|    } catch (error) {
   767|      res.status(500).json({ message: "Σφάλμα κατά τη δημιουργία σχολίου" });
   768|    }
   769|  });
   770|
   771|  app.get("/api/polls/:id/comments", async (req, res) => {
   772|    try {
   773|      const pollId = parseInt(req.params.id);
   774|      const comments = await storage.getPollComments(pollId);
   775|      res.json(comments);
   776|    } catch (error) {
   777|      res.status(500).json({ message: "Σφάλμα κατά την ανάκτηση σχολίων" });
   778|    }
   779|  });
   780|
  1809|  app.get("/api/communities", async (req, res) => {
  1810|    try {
  1811|      const userId = req.user?.id;
  1812|      const communities = await storage.getCommunities(userId);
  1813|      res.json(communities);
  1814|    } catch (error) {
  1815|      console.error("Error fetching communities:", error);
  1816|      res.status(500).json({ message: "Failed to fetch communities" });
  1817|    }
  1818|  });
  1819|
  1820|  // Create community (authenticated)
  1821|  app.post("/api/communities", requireAuth, async (req: any, res) => {
  1822|    try {
  1823|      const { name, description, type, governanceModel } = req.body;
  1824|      
  1825|      if (!name) {
  1826|        return res.status(400).json({ message: "Name is required" });
  1827|      }
  1828|
  1829|      const community = await storage.createCommunity({
  1830|        name,
  1831|        description,
  1832|        type: type || 'autonomous',
  1833|        governanceModel: governanceModel || 'no_admin',
  1834|        creatorId: req.user.id,
  1835|      });
  1836|
  1837|      // Auto-add creator as founder
  1838|      await storage.addCommunityMember(community.id, req.user.id, 'founder');
  1839|
  1840|      res.status(201).json(community);
  1841|    } catch (error) {
  1842|      console.error("Error creating community:", error);
  1843|      res.status(500).json({ message: "Failed to create community" });
  1844|    }
  1845|  });
  1846|
  1847|  // Get community details
  1848|  app.get("/api/communities/:id", async (req, res) => {
  1849|    try {
  1850|      const community = await storage.getCommunity(parseInt(req.params.id));
  1851|      if (!community) return res.status(404).json({ message: "Community not found" });
  1852|      res.json(community);
  1853|    } catch (error) {
  1854|      console.error("Error fetching community:", error);
  1855|      res.status(500).json({ message: "Failed to fetch community" });
  1856|    }
  1857|  });
  1858|
  1859|  // Update community (admin/founder only)
  1860|  app.patch("/api/communities/:id", requireAuth, async (req: any, res) => {
  1861|    try {
  1862|      const communityId = parseInt(req.params.id);
  1863|      const role = await storage.getCommunityMemberRole(communityId, req.user.id);
  1864|      
  1865|      if (!role || (role !== 'admin' && role !== 'founder')) {
  1866|        return res.status(403).json({ message: "Not authorized" });
  1867|      }
  1868|
  1869|      const community = await storage.updateCommunity(communityId, req.body);
  1870|      res.json(community);
  1871|    } catch (error) {
  1872|      console.error("Error updating community:", error);
  1873|      res.status(500).json({ message: "Failed to update community" });
  1874|    }
  1875|  });
  1876|
  1877|  // Get community members
  1878|  app.get("/api/communities/:id/members", async (req, res) => {
  1879|    try {
  1880|      const members = await storage.getCommunityMembers(parseInt(req.params.id));
  1881|      res.json(members);
  1882|    } catch (error) {
  1883|      console.error("Error fetching members:", error);
  1884|      res.status(500).json({ message: "Failed to fetch members" });
  1885|    }
  1886|  });
  1887|
  1888|  // Join community (authenticated)
  1889|  app.post("/api/communities/:id/members", requireAuth, async (req: any, res) => {
  1890|    try {
  1891|      const communityId = parseInt(req.params.id);
  1892|      const userId = req.user.id;
  1893|
  1894|      // Check if already a member
  1895|      const isMember = await storage.isCommunityMember(communityId, userId);
  1896|      if (isMember) {
  1897|        return res.status(409).json({ message: "Already a member" });
  1898|      }
  1899|
  1900|      const member = await storage.addCommunityMember(communityId, userId);
  1901|      res.status(201).json(member);
  1902|    } catch (error) {
  1903|      console.error("Error joining community:", error);
  1904|      res.status(500).json({ message: "Failed to join community" });
  1905|    }
  1906|  });
  1907|
  1908|  // Leave community (authenticated)
  1909|  app.delete("/api/communities/:id/members", requireAuth, async (req: any, res) => {
  1910|    try {
  1911|      const communityId = parseInt(req.params.id);
  1912|      const userId = req.user.id;
  1913|
  1914|      await storage.removeCommunityMember(communityId, userId);
  1915|      res.json({ success: true });
  1916|    } catch (error) {
  1917|      console.error("Error leaving community:", error);
  1918|      res.status(500).json({ message: "Failed to leave community" });
  1919|    }
  1920|  });
  1921|
  1922|  // ─── Demopolis: Proposal Routes ────────────────────────────────────────────
  1923|
  1924|  // Global proposals endpoint (all communities)
  1925|  app.get("/api/proposals", async (req, res) => {
  1926|    try {
  1927|      const limit = parseInt(req.query.limit as string) || 20;
  1928|      const proposals = await storage.getAllProposals(limit);
  1929|      res.json(proposals);
  1930|    } catch (e: any) {
  1931|      res.status(500).json({ message: e.message });
  1932|    }
  1933|  });
  1934|
  1935|  // List proposals for a community
  1936|  app.get("/api/communities/:communityId/proposals", async (req, res) => {
  1937|    try {
  1938|      const communityId = parseInt(req.params.communityId);
  1939|      const { status, category } = req.query;
  1940|      
  1941|      const proposals = await storage.getProposals(communityId, {
  1942|        status: status as string,
  1943|        category: category as string,
  1944|      });
  1945|      res.json(proposals);
  1946|    } catch (error) {
  1947|      console.error("Error fetching proposals:", error);
  1948|      res.status(500).json({ message: "Failed to fetch proposals" });
  1949|    }
  1950|  });
  1951|
  1952|  // Create proposal (authenticated, must be community member)
  1953|  app.post("/api/communities/:communityId/proposals", requireAuth, async (req: any, res) => {
  1954|    try {
  1955|      const communityId = parseInt(req.params.communityId);
  1956|      const userId = req.user.id;
  1957|
  1958|      // Check membership
  1959|      const isMember = await storage.isCommunityMember(communityId, userId);
  1960|      if (!isMember) {
  1961|        return res.status(403).json({ message: "Must be a community member to submit proposals" });
  1962|      }
  1963|
  1964|      const { question, solution, category } = req.body;
  1965|
  1966|      if (!question || !solution) {
  1967|        return res.status(400).json({ message: "Question and solution are required" });
  1968|      }
  1969|
  1970|      const proposal = await storage.createProposal({
  1971|        communityId,
  1972|        authorId: userId,
  1973|        question,
  1974|        solution,
  1975|        category,
  1976|        status: 'draft',
  1977|      });
  1978|
  1979|      res.status(201).json(proposal);
  1980|    } catch (error) {
  1981|      console.error("Error creating proposal:", error);
  1982|      res.status(500).json({ message: "Failed to create proposal" });
  1983|    }
  1984|  });
  1985|
  1986|  // Get proposal details
  1987|  app.get("/api/proposals/:id", async (req, res) => {
  1988|    try {
  1989|      const proposal = await storage.getProposal(parseInt(req.params.id));
  1990|      if (!proposal) return res.status(404).json({ message: "Proposal not found" });
  1991|      res.json(proposal);
  1992|    } catch (error) {
  1993|      console.error("Error fetching proposal:", error);
  1994|      res.status(500).json({ message: "Failed to fetch proposal" });
  1995|    }
  1996|  });
  1997|
  1998|  // Update proposal (author only, draft only)
  1999|  app.patch("/api/proposals/:id", requireAuth, async (req: any, res) => {
  2000|    try {
  2001|