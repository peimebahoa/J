import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import { fileManager } from "./fileManager";
import multer from "multer";
import { insertWebsiteSchema, insertScriptTemplateSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Configure multer for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    fileFilter: (req, file, cb) => {
      if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
        cb(null, true);
      } else {
        cb(new Error('Only ZIP files are allowed'));
      }
    }
  });

  // Configure multer for profile picture uploads
  const profileUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
    fileFilter: (req, file, cb) => {
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Auth routes are now handled in auth.ts

  // Profile picture upload route
  app.post('/api/profile-picture', isAuthenticated, profileUpload.single('profilePicture'), async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Save the profile picture to the user's folder
      const fileName = `profile-${userId}-${Date.now()}.${req.file.mimetype.split('/')[1]}`;
      const filePath = await fileManager.saveProfilePicture(userId, fileName, req.file.buffer);
      
      // Update user's profile image URL in database
      const profileImageUrl = `/uploads/profiles/${fileName}`;
      await storage.updateUser(userId, { profileImageUrl });
      
      res.json({ profileImageUrl });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      res.status(500).json({ message: "Failed to upload profile picture" });
    }
  });

  // Serve uploaded profile pictures
  app.get('/uploads/profiles/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = fileManager.getProfilePicturePath(filename);
    res.sendFile(filePath);
  });

  // Website Management Routes

  // Get user's websites
  app.get('/api/websites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const websites = await storage.getUserWebsites(userId);
      res.json(websites);
    } catch (error) {
      console.error("Error fetching websites:", error);
      res.status(500).json({ message: "Failed to fetch websites" });
    }
  });

  // Get single website
  app.get('/api/websites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(website);
    } catch (error) {
      console.error("Error fetching website:", error);
      res.status(500).json({ message: "Failed to fetch website" });
    }
  });

  // Create new website
  app.post('/api/websites', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      
      // Check if user already has a website (one website per user limit)
      const existingWebsites = await storage.getUserWebsites(userId);
      if (existingWebsites.length > 0) {
        return res.status(400).json({ message: "You can only create one website. Please delete your existing website first." });
      }
      
      // Validate request body
      const createWebsiteSchema = insertWebsiteSchema.extend({
        name: z.string().min(1, "Website name is required"),
        subdomain: z.string().min(1, "Subdomain is required").regex(/^[a-z0-9-]+$/, "Subdomain can only contain lowercase letters, numbers, and hyphens"),
      });
      
      const validatedData = createWebsiteSchema.parse({
        ...req.body,
        userId
      });

      // Check if subdomain is already taken
      const existingWebsite = await storage.getWebsiteBySubdomain(validatedData.subdomain);
      if (existingWebsite) {
        return res.status(400).json({ message: "Subdomain already taken" });
      }

      // Create website directory
      await fileManager.createUserWebsiteDir(userId, validatedData.subdomain);

      // Create website in database
      const website = await storage.createWebsite(validatedData);

      // Log the creation
      await storage.createWebsiteLog({
        websiteId: website.id,
        action: "created",
        details: { name: website.name, subdomain: website.subdomain }
      });

      res.status(201).json(website);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating website:", error);
      res.status(500).json({ message: "Failed to create website" });
    }
  });

  // Update website
  app.patch('/api/websites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const updateData = req.body;
      delete updateData.userId; // Prevent changing userId
      delete updateData.subdomain; // Prevent changing subdomain after creation

      const updatedWebsite = await storage.updateWebsite(req.params.id, updateData);

      // Log the update
      await storage.createWebsiteLog({
        websiteId: website.id,
        action: "updated",
        details: updateData
      });

      res.json(updatedWebsite);
    } catch (error) {
      console.error("Error updating website:", error);
      res.status(500).json({ message: "Failed to update website" });
    }
  });

  // Delete website
  app.delete('/api/websites/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Delete website files
      await fileManager.deleteWebsiteDir(userId, website.subdomain);

      // Delete from database
      await storage.deleteWebsite(req.params.id);

      res.json({ message: "Website deleted successfully" });
    } catch (error) {
      console.error("Error deleting website:", error);
      res.status(500).json({ message: "Failed to delete website" });
    }
  });

  // Change website script
  app.post('/api/websites/:id/change-script', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const { scriptName } = req.body;
      
      if (!scriptName) {
        return res.status(400).json({ message: "Script name is required" });
      }

      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Check if script exists
      if (!await fileManager.scriptExists(scriptName)) {
        return res.status(404).json({ message: "Script not found" });
      }

      // Extract script to website directory
      await fileManager.extractScript(userId, website.subdomain, scriptName);

      // Update website record
      const updatedWebsite = await storage.updateWebsite(req.params.id, {
        currentScript: scriptName
      });

      // Log the script change
      await storage.createWebsiteLog({
        websiteId: website.id,
        action: "script_changed",
        details: { 
          oldScript: website.currentScript,
          newScript: scriptName 
        }
      });

      res.json({
        message: "Script changed successfully",
        website: updatedWebsite,
        url: fileManager.getWebsiteUrl(website.subdomain)
      });
    } catch (error) {
      console.error("Error changing script:", error);
      res.status(500).json({ message: "Failed to change script" });
    }
  });

  // Get website files
  app.get('/api/websites/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const files = await fileManager.getWebsiteFiles(userId, website.subdomain);
      res.json(files);
    } catch (error) {
      console.error("Error fetching website files:", error);
      res.status(500).json({ message: "Failed to fetch website files" });
    }
  });

  // Get website logs
  app.get('/api/websites/:id/logs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id;
      const website = await storage.getWebsite(req.params.id);
      
      if (!website) {
        return res.status(404).json({ message: "Website not found" });
      }
      
      if (website.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const logs = await storage.getWebsiteLogs(req.params.id);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching website logs:", error);
      res.status(500).json({ message: "Failed to fetch website logs" });
    }
  });

  // Script Template Management Routes

  // Get available script templates
  app.get('/api/scripts', isAuthenticated, async (req: any, res) => {
    try {
      const templates = await storage.getScriptTemplates();
      const availableScripts = await fileManager.getAvailableScripts();
      
      // Merge database templates with available files
      const scriptsWithFiles = templates.map(template => ({
        ...template,
        fileExists: availableScripts.includes(template.fileName)
      }));

      res.json(scriptsWithFiles);
    } catch (error) {
      console.error("Error fetching scripts:", error);
      res.status(500).json({ message: "Failed to fetch scripts" });
    }
  });

  // Upload new script
  app.post('/api/scripts/upload', isAuthenticated, upload.single('script'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const { name, displayName, description, version } = req.body;
      
      if (!name || !displayName) {
        return res.status(400).json({ message: "Name and display name are required" });
      }

      // Check if script with same name already exists
      const existing = await storage.getScriptTemplateByName(name);
      if (existing) {
        return res.status(400).json({ message: "Script with this name already exists" });
      }

      const fileName = `${name}.zip`;
      
      // Upload file
      await fileManager.uploadScript(fileName, req.file.buffer);

      // Save to database
      const template = await storage.createScriptTemplate({
        name,
        displayName,
        description: description || null,
        version: version || "1.0.0",
        fileName
      });

      res.status(201).json(template);
    } catch (error) {
      console.error("Error uploading script:", error);
      res.status(500).json({ message: "Failed to upload script" });
    }
  });

  // Delete script template
  app.delete('/api/scripts/:id', isAuthenticated, async (req: any, res) => {
    try {
      const template = await storage.getScriptTemplate(req.params.id);
      
      if (!template) {
        return res.status(404).json({ message: "Script template not found" });
      }

      // Delete file
      await fileManager.deleteScript(template.fileName);

      // Delete from database
      await storage.deleteScriptTemplate(req.params.id);

      res.json({ message: "Script template deleted successfully" });
    } catch (error) {
      console.error("Error deleting script template:", error);
      res.status(500).json({ message: "Failed to delete script template" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
