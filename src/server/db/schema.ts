import { sql } from "drizzle-orm";
import { index, pgPolicy, pgRole, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Journaled security migrations manage role attributes/grants and FORCE RLS,
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

export const learningGoals = pgTable('learning_goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  status: text('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownGoal = sql`exists (select 1 from "public"."users" as identity_user where identity_user.id = ${table.userId} and identity_user.auth_issuer = ${issuer} and identity_user.auth_subject = ${subject})`;
  return [
    index('learning_goals_user_id_idx').on(table.userId),
    pgPolicy('goals_select_own', { for: 'select', to: runtimeRole, using: ownGoal }),
    pgPolicy('goals_insert_own', { for: 'insert', to: runtimeRole, withCheck: ownGoal }),
    pgPolicy('goals_update_own', { for: 'update', to: runtimeRole, using: ownGoal, withCheck: ownGoal }),
  ];
}).enableRLS();

export const competencies = pgTable('competencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  goalId: uuid('goal_id').notNull().references(() => learningGoals.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  status: text('status').notNull().default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownCompetency = sql`exists (select 1 from "public"."learning_goals" g join "public"."users" as identity_user on g.user_id = identity_user.id where g.id = ${table.goalId} and identity_user.auth_issuer = ${issuer} and identity_user.auth_subject = ${subject})`;
  return [
    index('competencies_goal_id_idx').on(table.goalId),
    pgPolicy('competencies_select_own', { for: 'select', to: runtimeRole, using: ownCompetency }),
    pgPolicy('competencies_insert_own', { for: 'insert', to: runtimeRole, withCheck: ownCompetency }),
    pgPolicy('competencies_update_own', { for: 'update', to: runtimeRole, using: ownCompetency, withCheck: ownCompetency }),
  ];
}).enableRLS();

export const practiceExercises = pgTable('practice_exercises', {
  id: uuid('id').primaryKey().defaultRandom(),
  competencyId: uuid('competency_id').notNull().references(() => competencies.id, { onDelete: 'cascade' }),
  scenarioPrompt: text('scenario_prompt').notNull(),
  expectedStructure: text('expected_structure').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownExercise = sql`exists (select 1 from "public"."competencies" c join "public"."learning_goals" g on c.goal_id = g.id join "public"."users" as identity_user on g.user_id = identity_user.id where c.id = ${table.competencyId} and identity_user.auth_issuer = ${issuer} and identity_user.auth_subject = ${subject})`;
  return [
    index('practice_exercises_competency_id_idx').on(table.competencyId),
    pgPolicy('exercises_select_own', { for: 'select', to: runtimeRole, using: ownExercise }),
    pgPolicy('exercises_insert_own', { for: 'insert', to: runtimeRole, withCheck: ownExercise }),
    pgPolicy('exercises_update_own', { for: 'update', to: runtimeRole, using: ownExercise, withCheck: ownExercise }),
  ];
}).enableRLS();

export const practiceEvaluations = pgTable('practice_evaluations', {
  id: uuid('id').primaryKey().defaultRandom(),
  exerciseId: uuid('exercise_id').notNull().references(() => practiceExercises.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userResponse: text('user_response').notNull(),
  feedback: text('feedback').notNull(),
  score: text('score').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => {
  const ownEvaluation = sql`exists (
    select 1
    from "public"."practice_exercises" exercise
    join "public"."competencies" competency on competency.id = exercise.competency_id
    join "public"."learning_goals" goal on goal.id = competency.goal_id
    join "public"."users" identity_user on identity_user.id = goal.user_id
    where exercise.id = ${table.exerciseId}
      and identity_user.id = ${table.userId}
      and identity_user.auth_issuer = ${issuer}
      and identity_user.auth_subject = ${subject}
  )`;
  return [
    index('practice_evaluations_exercise_id_idx').on(table.exerciseId),
    index('practice_evaluations_user_id_idx').on(table.userId),
    pgPolicy('evaluations_select_own', { for: 'select', to: runtimeRole, using: ownEvaluation }),
    pgPolicy('evaluations_insert_own', { for: 'insert', to: runtimeRole, withCheck: ownEvaluation }),
  ];
}).enableRLS();

export const partnerInquiries = pgTable("partner_inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  inquiryReference: text("inquiry_reference").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization").notNull(),
  role: text("role").notNull(),
  category: text("category").notNull(),
  stageOrScale: text("stage_or_scale"),
  message: text("message").notNull(),
  notificationStatus: text("notification_status").notNull().default("pending"),
  notificationError: text("notification_error"),
  notificationDispatchId: text("notification_dispatch_id"),
  notificationSentAt: timestamp("notification_sent_at", { withTimezone: true }),
  idempotencyKey: text("idempotency_key").unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("partner_inquiries_email_idx").on(table.email),
  index("partner_inquiries_org_idx").on(table.organization),
  index("partner_inquiries_created_at_idx").on(table.createdAt),
  index("partner_inquiries_status_idx").on(table.notificationStatus),
  pgPolicy("partner_inquiries_runtime_insert", { for: "insert", to: runtimeRole, withCheck: sql`true` }),
  pgPolicy("partner_inquiries_runtime_select", { for: "select", to: runtimeRole, using: sql`true` }),
  pgPolicy("partner_inquiries_runtime_update", { for: "update", to: runtimeRole, using: sql`true`, withCheck: sql`true` }),
]).enableRLS();

