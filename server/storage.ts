import {
  users,
  websites,
  scriptTemplates,
  websiteLogs,
  type User,
  type UpsertUser,
  type Website,
  type InsertWebsite,
  type ScriptTemplate,
  type InsertScriptTemplate,
  type WebsiteLog,
  type InsertWebsiteLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Omit<UpsertUser, 'id'>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<UpsertUser>): Promise<User>;
  
  // Website operations
  getUserWebsites(userId: string): Promise<Website[]>;
  getWebsite(id: string): Promise<Website | undefined>;
  getWebsiteBySubdomain(subdomain: string): Promise<Website | undefined>;
  createWebsite(website: InsertWebsite): Promise<Website>;
  updateWebsite(id: string, updates: Partial<InsertWebsite>): Promise<Website>;
  deleteWebsite(id: string): Promise<void>;
  
  // Script template operations
  getScriptTemplates(): Promise<ScriptTemplate[]>;
  getScriptTemplate(id: string): Promise<ScriptTemplate | undefined>;
  getScriptTemplateByName(name: string): Promise<ScriptTemplate | undefined>;
  createScriptTemplate(template: InsertScriptTemplate): Promise<ScriptTemplate>;
  updateScriptTemplate(id: string, updates: Partial<InsertScriptTemplate>): Promise<ScriptTemplate>;
  deleteScriptTemplate(id: string): Promise<void>;
  
  // Website log operations
  getWebsiteLogs(websiteId: string): Promise<WebsiteLog[]>;
  createWebsiteLog(log: InsertWebsiteLog): Promise<WebsiteLog>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Omit<UpsertUser, 'id'>): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<UpsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Website operations
  async getUserWebsites(userId: string): Promise<Website[]> {
    return await db.select().from(websites).where(eq(websites.userId, userId)).orderBy(desc(websites.createdAt));
  }

  async getWebsite(id: string): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.id, id));
    return website;
  }

  async getWebsiteBySubdomain(subdomain: string): Promise<Website | undefined> {
    const [website] = await db.select().from(websites).where(eq(websites.subdomain, subdomain));
    return website;
  }

  async createWebsite(website: InsertWebsite): Promise<Website> {
    const [newWebsite] = await db
      .insert(websites)
      .values(website)
      .returning();
    return newWebsite;
  }

  async updateWebsite(id: string, updates: Partial<InsertWebsite>): Promise<Website> {
    const [website] = await db
      .update(websites)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(websites.id, id))
      .returning();
    return website;
  }

  async deleteWebsite(id: string): Promise<void> {
    await db.delete(websites).where(eq(websites.id, id));
  }

  // Script template operations
  async getScriptTemplates(): Promise<ScriptTemplate[]> {
    return await db.select().from(scriptTemplates).where(eq(scriptTemplates.isActive, true)).orderBy(scriptTemplates.displayName);
  }

  async getScriptTemplate(id: string): Promise<ScriptTemplate | undefined> {
    const [template] = await db.select().from(scriptTemplates).where(eq(scriptTemplates.id, id));
    return template;
  }

  async getScriptTemplateByName(name: string): Promise<ScriptTemplate | undefined> {
    const [template] = await db.select().from(scriptTemplates).where(eq(scriptTemplates.name, name));
    return template;
  }

  async createScriptTemplate(template: InsertScriptTemplate): Promise<ScriptTemplate> {
    const [newTemplate] = await db
      .insert(scriptTemplates)
      .values(template)
      .returning();
    return newTemplate;
  }

  async updateScriptTemplate(id: string, updates: Partial<InsertScriptTemplate>): Promise<ScriptTemplate> {
    const [template] = await db
      .update(scriptTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(scriptTemplates.id, id))
      .returning();
    return template;
  }

  async deleteScriptTemplate(id: string): Promise<void> {
    await db.delete(scriptTemplates).where(eq(scriptTemplates.id, id));
  }

  // Website log operations
  async getWebsiteLogs(websiteId: string): Promise<WebsiteLog[]> {
    return await db.select().from(websiteLogs).where(eq(websiteLogs.websiteId, websiteId)).orderBy(desc(websiteLogs.createdAt));
  }

  async createWebsiteLog(log: InsertWebsiteLog): Promise<WebsiteLog> {
    const [newLog] = await db
      .insert(websiteLogs)
      .values(log)
      .returning();
    return newLog;
  }
}

export const storage = new DatabaseStorage();
