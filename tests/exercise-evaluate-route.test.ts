import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProvider } from "@/src/server/auth/types";

const mocks = vi.hoisted(() => {
  class MockExerciseAccessLockedError extends Error {
    constructor(message = "Exercise is locked. Complete preceding prerequisite exercises to unlock it.") {
      super(message);
      this.name = "ExerciseAccessLockedError";
    }
  }

  class MockExerciseNotFoundError extends Error {
    constructor(message = "Exercise not found.") {
      super(message);
      this.name = "ExerciseNotFoundError";
    }
  }

  const provider = { getIdentity: vi.fn<AuthProvider["getIdentity"]>() };
  const repository = { evaluateExercise: vi.fn() };
  const database = { kind: "mock-database" };

  return {
    provider,
    repository,
    database,
    ExerciseAccessLockedError: MockExerciseAccessLockedError,
    ExerciseNotFoundError: MockExerciseNotFoundError,
    createAuthProvider: vi.fn(() => provider),
    getDb: vi.fn(() => database),
    createRepository: vi.fn(() => repository),
  };
});

vi.mock("@/src/server/auth/supabase", () => ({ createSupabaseAuthProvider: mocks.createAuthProvider }));
vi.mock("@/src/server/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/src/server/goals/repository", () => ({
  createGoalsRepository: mocks.createRepository,
  ExerciseAccessLockedError: mocks.ExerciseAccessLockedError,
  ExerciseNotFoundError: mocks.ExerciseNotFoundError,
}));

import { POST } from "@/app/api/exercises/[id]/evaluate/route";

const identity = { issuer: "https://auth.example.test", subject: "verified-subject" };
const validExerciseId = "00000000-0000-4000-8000-000000000001";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createAuthProvider.mockReturnValue(mocks.provider);
  mocks.provider.getIdentity.mockResolvedValue(identity);
  mocks.getDb.mockReturnValue(mocks.database);
  mocks.createRepository.mockReturnValue(mocks.repository);
});

describe("POST /api/exercises/[id]/evaluate Route", () => {
  it("returns HTTP 403 when evaluating a locked exercise with ExerciseAccessLockedError", async () => {
    mocks.repository.evaluateExercise.mockRejectedValue(
      new mocks.ExerciseAccessLockedError("Exercise is locked. Complete preceding prerequisite exercises to unlock it.")
    );

    const request = new Request(`http://localhost:3000/api/exercises/${validExerciseId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "Direct attempt on locked lesson" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: validExerciseId }) });
    expect(response.status).toBe(403);
    expect(response.headers.get("cache-control")).toBe("no-store");

    const data = await response.json();
    expect(data.error).toBe("exercise_access_locked");
    expect(data.message).toContain("Exercise is locked");
  });

  it("returns HTTP 401 when the request lacks authentication", async () => {
    mocks.provider.getIdentity.mockResolvedValue(null);

    const request = new Request(`http://localhost:3000/api/exercises/${validExerciseId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "Attempt without auth" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: validExerciseId }) });
    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("unauthenticated");
  });

  it("returns HTTP 400 for an invalid UUID exercise ID", async () => {
    const invalidId = "not-a-uuid";
    const request = new Request(`http://localhost:3000/api/exercises/${invalidId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "Valid response text" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: invalidId }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("invalid_exercise_id");
  });

  it("returns HTTP 400 for an empty response body", async () => {
    const request = new Request(`http://localhost:3000/api/exercises/${validExerciseId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "   " }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: validExerciseId }) });
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBe("invalid_response_payload");
  });

  it("returns HTTP 404 when the exercise is not found", async () => {
    mocks.repository.evaluateExercise.mockRejectedValue(
      new mocks.ExerciseNotFoundError("Exercise not found.")
    );

    const request = new Request(`http://localhost:3000/api/exercises/${validExerciseId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "Attempt on non-existent exercise" }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: validExerciseId }) });
    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.error).toBe("exercise_not_found");
  });

  it("returns HTTP 200 with evaluation record on successful practice submission", async () => {
    const mockEval = {
      id: "eval-123",
      exerciseId: validExerciseId,
      score: "mastered",
      feedbackText: "Mastered scenario criteria.",
      userResponse: "Yesterday I completed the API fix.",
      createdAt: new Date().toISOString(),
    };
    mocks.repository.evaluateExercise.mockResolvedValue(mockEval);

    const request = new Request(`http://localhost:3000/api/exercises/${validExerciseId}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ response: "Yesterday I completed the API fix." }),
    });

    const response = await POST(request, { params: Promise.resolve({ id: validExerciseId }) });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.score).toBe("mastered");
    expect(data.id).toBe("eval-123");
  });
});
