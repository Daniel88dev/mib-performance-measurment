import { pgTable, varchar, boolean, timestamp, decimal, integer, unique, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Users table for Better Auth
export const users = pgTable("user", {
  id: varchar("id", { length: 255 }).primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: varchar("name", { length: 255 }),
  image: varchar("image", { length: 255 }),
  isApproved: boolean("is_approved").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Account table for Better Auth (required for password auth)
export const accounts = pgTable("account", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: varchar("account_id", { length: 255 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),
  accessToken: varchar("access_token", { length: 255 }),
  refreshToken: varchar("refresh_token", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  password: varchar("password", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions table for Better Auth
export const sessions = pgTable("session", {
  id: varchar("id", { length: 255 }).primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at").notNull(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 255 }),
  userAgent: varchar("user_agent", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Performance metrics table - stores aggregated data only
export const performanceMetrics = pgTable(
  "performance_metrics",
  {
    id: varchar("id", { length: 255 }).primaryKey(),
    bucketTimestamp: timestamp("bucket_timestamp").notNull(),
    accountId: varchar("account_id", { length: 100 }).notNull(),
    type: varchar("type", { length: 255 }).notNull(),
    avgDuration: decimal("avg_duration", { precision: 10, scale: 2 }).notNull(),
    recordCount: integer("record_count").notNull(),
    uploadedBy: varchar("uploaded_by", { length: 255 }).notNull().references(() => users.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: prevent duplicate bucket/account/type combinations
    uniqueBucketAccountType: unique().on(table.bucketTimestamp, table.accountId, table.type),
    // Composite index for efficient filtering
    bucketAccountTypeIdx: index("bucket_account_type_idx").on(
      table.bucketTimestamp,
      table.accountId,
      table.type
    ),
    // Individual indexes for filtering
    accountIdIdx: index("account_id_idx").on(table.accountId),
    typeIdx: index("type_idx").on(table.type),
    bucketTimestampIdx: index("bucket_timestamp_idx").on(table.bucketTimestamp),
  })
);

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  accounts: many(accounts),
  performanceMetrics: many(performanceMetrics),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const performanceMetricsRelations = relations(performanceMetrics, ({ one }) => ({
  uploadedBy: one(users, {
    fields: [performanceMetrics.uploadedBy],
    references: [users.id],
  }),
}));

// Types inferred from schema
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type NewPerformanceMetric = typeof performanceMetrics.$inferInsert;
