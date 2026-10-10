import { sql } from "drizzle-orm";
import { index, pgPolicy, pgRole, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// The journaled security migration manages role attributes/grants and FORCE RLS,
// which Drizzle does not model. Tables and policies remain defined here.
export const runtimeRole = pgRole("speakql_runtime").existing();
const issuer = sql`nullif(pg_catalog.current_setting('speakql.auth_issuer', true), '')`;
const subject = sql`nullif(pg_catalog.current_setting('speakql.auth_subject', true), '')`;

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  authIssuer: text("auth_issuer").notNull(),
  authSubject: text("auth_subject").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownIdentity = sql`${table.authIssuer} = ${issuer} and ${table.authSubject} = ${subject}`;
  return [
    uniqueIndex("users_auth_identity_unique").on(table.authIssuer, table.authSubject),
    pgPolicy("users_select_own", { for: "select", to: runtimeRole, using: ownIdentity }),
    pgPolicy("users_insert_own", { for: "insert", to: runtimeRole, withCheck: ownIdentity }),
  ];
}).enableRLS();

export const userProfiles = pgTable("user_profiles", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  displayName: text("display_name").notNull(),
  locale: text("locale").notNull().default("en-US"),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownProfile = sql`exists (select 1 from "public"."users" as identity_user where identity_user.id = ${table.userId} and identity_user.auth_issuer = ${issuer} and identity_user.auth_subject = ${subject})`;
  return [
    pgPolicy("profiles_select_own", { for: "select", to: runtimeRole, using: ownProfile }),
    pgPolicy("profiles_insert_own", { for: "insert", to: runtimeRole, withCheck: ownProfile }),
    pgPolicy("profiles_update_own", { for: "update", to: runtimeRole, using: ownProfile, withCheck: ownProfile }),
  ];
}).enableRLS();

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  resourceType: text("resource_type").notNull(),
  resourceId: text("resource_id").notNull(),
  metadata: text("metadata").notNull().default("{}"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().default(sql`now()`),
}, (table) => [
  index("audit_events_actor_user_id_idx").on(table.actorUserId),
  index("audit_events_action_idx").on(table.action),
  pgPolicy("audit_insert_own_profile", {
    for: "insert",
    to: runtimeRole,
    withCheck: sql`exists (select 1 from "public"."users" as identity_user where identity_user.id = ${table.actorUserId} and identity_user.auth_issuer = ${issuer} and identity_user.auth_subject = ${subject}) and ${table.resourceType} = 'user_profile' and ${table.resourceId} = ${table.actorUserId}::text and ${table.action} in ('profile.created', 'profile.updated')`,
  }),
]).enableRLS();
