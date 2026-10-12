import { describe, expect, it, vi } from "vitest";
import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool, QueryConfig } from "pg";
import type { AuthenticatedIdentity } from "../src/server/auth/types";
import { createGoalsRepository } from "../src/server/goals/repository";

// Real Drizzle SQL generation and transaction control; this driver does not
// execute SQL or evaluate PostgreSQL RLS policies.
type Query = { text: string; params: unknown[]; connection: number };
type Rows = unknown[][] | Record<string, unknown>[];
type Handler = (query: Query) => Rows | undefined | Promise<Rows | undefined>;

function fixture(handler: Handler = () => undefined) {
  const queries: Query[] = [];
  const release = vi.fn();
  let connectionId = 0;
  class MockPool {
    async connect() {
      const connection = connectionId++;
      return {
        async query(config: Pick<QueryConfig<unknown[]>, "text">, params: unknown[] = []) {
          const query = { text: config.text.replace(/\s+/g, " ").trim(), params, connection };
          queries.push(query);
          const rows = await handler(query) ?? (query.text.includes("pg_catalog.pg_roles login") ? [{ allowed: true }] : []);
          return { rows };
        },
        release: () => release(connection),
      };
    }
  }
  return { repository: createGoalsRepository(drizzle(new MockPool() as unknown as Pool)), queries, release };
}

const identity: AuthenticatedIdentity = { issuer: "https://auth.example.test", subject: "verified-user" };
const maliciousIdentity: AuthenticatedIdentity = { issuer: "issuer'); reset role; --", subject: "subject' OR TRUE --" };
const userId = "00000000-0000-4000-8000-000000000001";
const goalId = "00000000-0000-4000-8000-000000000002";
const competencyId = "00000000-0000-4000-8000-000000000003";
const exerciseId = "00000000-0000-4000-8000-000000000004";
const evaluationId = "00000000-0000-4000-8000-000000000005";
const timestamp = "2026-10-10T12:00:00.000Z";

const isContext = (query: Query) => query.text.includes("set_config('speakql.auth_issuer'");
const isUserRead = (query: Query) => query.text.startsWith('select "id" from "users"');
const isOwnershipCheck = (query: Query) => query.text.startsWith('select "practice_exercises"."id"') && query.text.includes('inner join "learning_goals"');
const isEvaluationInsert = (query: Query) => query.text.startsWith('insert into "practice_evaluations"');

function writeRows(query: Query): Rows | undefined {
  if (isUserRead(query)) return [[userId]];
  if (isOwnershipCheck(query)) return [[exerciseId, "Respond to the customer with context.", "A professional response with context."]];
  if (query.text.startsWith('insert into "learning_goals"')) return [[goalId, ...query.params, "active", timestamp, timestamp]];
  if (query.text.startsWith('insert into "competencies"')) return [[competencyId, ...query.params, "pending", timestamp, timestamp]];
  if (isEvaluationInsert(query)) return [[evaluationId, ...query.params, timestamp]];
}

describe("Goals Repository Security & Parameterization (mock driver)", () => {
  it("uses parameterized Drizzle query builder and never interpolates identity into raw SQL", async () => {
    const f = fixture(writeRows);

    const maliciousDescription = "goal'); DROP TABLE users; --";
    await expect(f.repository.createGoal(maliciousIdentity, { description: maliciousDescription })).resolves.toMatchObject({
      id: goalId,
      userId,
      description: maliciousDescription,
    });

    // Ensure context is set securely (withIdentityTransaction is called and executes correctly)
    const contextQuery = f.queries.find(isContext);
    expect(contextQuery).toBeDefined();
    expect(contextQuery!.params).toEqual([maliciousIdentity.issuer, maliciousIdentity.subject]);
    expect(contextQuery!.text).toContain("set_config('speakql.auth_issuer', $1, true)");
    expect(contextQuery!.text).toContain("set_config('speakql.auth_subject', $2, true)");
    
    // Ensure the malicious description was parameterized, not embedded in the SQL text
    const insertGoalQuery = f.queries.find(q => q.text.includes('insert into "learning_goals"'));
    expect(insertGoalQuery).toBeDefined();
    expect(insertGoalQuery!.text).not.toContain("DROP TABLE");
    expect(insertGoalQuery!.params).toEqual([userId, maliciousDescription]);
    expect(f.queries.filter(q => q.text.startsWith('insert into "competencies"')).map(q => q.params[0])).toEqual([goalId, goalId]);
    expect(f.queries.filter(q => q.text.startsWith('insert into "practice_exercises"')).map(q => q.params[0])).toEqual([competencyId, competencyId]);

    // Ensure identity values are parameterized in the user lookup
    const selectUserQuery = f.queries.find(q => q.text.includes('select "id" from "users"'));
    expect(selectUserQuery).toBeDefined();
    expect(selectUserQuery!.params).toEqual([maliciousIdentity.issuer, maliciousIdentity.subject, 1]);
    expect(selectUserQuery!.text).toContain('where ("users"."auth_issuer" = $1 and "users"."auth_subject" = $2)');
    for (const query of f.queries) {
      expect(query.text).not.toContain(maliciousIdentity.issuer);
      expect(query.text).not.toContain(maliciousIdentity.subject);
    }
  });

  it("scopes goal and dashboard reads to both identity claims", async () => {
    const f = fixture((query) => query.text.startsWith('select "learning_goals"') ? [] : undefined);

    await expect(f.repository.getGoals(maliciousIdentity)).resolves.toEqual([]);
    await expect(f.repository.getDashboardData(maliciousIdentity)).resolves.toEqual({
      goals: [],
      competencies: [],
      exercises: [],
      evaluations: [],
      analytics: {
        measured: {
          completedEvaluations: 0,
          masteredEvaluations: 0,
          needsWorkEvaluations: 0,
          unclassifiedEvaluations: 0,
        },
        estimate: {
          progressPercentage: 0,
          label: "Estimate",
          basis: "Latest result per exercise: mastered exercises divided by total exercises. Repeated evaluations do not inflate this estimate.",
          competencyStatuses: [],
        },
        nextAction: null,
        mistakeMemory: [],
      },
    });

    const goalReads = f.queries.filter((query) => query.text.startsWith('select "learning_goals"'));
    expect(goalReads).toHaveLength(2);
    for (const query of goalReads) {
      expect(query.params).toEqual([maliciousIdentity.issuer, maliciousIdentity.subject]);
      expect(query.text).not.toContain(maliciousIdentity.issuer);
      expect(query.text).not.toContain(maliciousIdentity.subject);
    }
  });

  it("checks joined exercise ownership before inserting a labelled fallback evaluation", async () => {
    const f = fixture(writeRows);
    const response = "A sufficiently detailed response for the demo evaluation.";

    const evaluation = await f.repository.evaluateExercise(maliciousIdentity, exerciseId, response);
    expect(evaluation).toMatchObject({
      id: evaluationId,
      exerciseId,
      userId,
      userResponse: response,
      score: "mastered",
    });
    expect(evaluation.feedback).toContain("Evaluation source: deterministic fallback (non-AI).");

    const ownership = f.queries.find(isOwnershipCheck);
    expect(ownership).toBeDefined();
    expect(ownership!.params).toEqual([
      exerciseId,
      userId,
      maliciousIdentity.issuer,
      maliciousIdentity.subject,
      1,
    ]);
    expect(ownership!.text).toContain('inner join "competencies"');
    expect(ownership!.text).toContain('inner join "learning_goals"');
    expect(ownership!.text).toContain('inner join "users"');
    expect(ownership!.text).not.toContain(maliciousIdentity.issuer);
    expect(ownership!.text).not.toContain(maliciousIdentity.subject);

    const evaluationInsert = f.queries.find(isEvaluationInsert);
    expect(evaluationInsert).toBeDefined();
    expect(f.queries.indexOf(evaluationInsert!)).toBeGreaterThan(f.queries.indexOf(ownership!));
    expect(evaluationInsert!.params).toEqual([
      exerciseId,
      userId,
      response,
      expect.stringContaining("Evaluation source: deterministic fallback (non-AI)."),
      "mastered",
    ]);
  });

  it.each(["foreign-exercise", "missing-exercise"])("rejects a %s before inserting an evaluation", async (requestedExerciseId) => {
    const f = fixture((query) => {
      if (isUserRead(query)) return [[userId]];
      if (isOwnershipCheck(query)) return [];
    });

    await expect(f.repository.evaluateExercise(identity, requestedExerciseId, "short response")).rejects.toThrow("Exercise not found or not owned by user.");
    expect(f.queries.some(isEvaluationInsert)).toBe(false);
    const ownership = f.queries.find(isOwnershipCheck);
    expect(ownership).toBeDefined();
    expect(ownership!.params[0]).toBe(requestedExerciseId);
  });
  
  it("rejects unauthorized access if identity is missing", async () => {
    const f = fixture();
    const badIdentity: AuthenticatedIdentity = { issuer: "", subject: "" };
    await expect(f.repository.createGoal(badIdentity, { description: "test" })).rejects.toThrow("verified issuer and subject");
    expect(f.queries).toEqual([]);
  });
});
