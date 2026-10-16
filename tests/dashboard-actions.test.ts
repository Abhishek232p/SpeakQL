import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthProvider } from "@/src/server/auth/types";

const mocks = vi.hoisted(() => {
  class MockExerciseAccessLockedError extends Error {
    constructor(message = "Exercise is locked. Complete preceding prerequisite exercises to unlock it.") {
      super(message);
      this.name = "ExerciseAccessLockedError";
    }
  }
  const provider = { getIdentity: vi.fn<AuthProvider["getIdentity"]>() };
  const repository = { createGoal: vi.fn(), evaluateExercise: vi.fn() };
  const database = { kind: "mock-database" };
  return {
    provider,
    repository,
    database,
    ExerciseAccessLockedError: MockExerciseAccessLockedError,
    createAuthProvider: vi.fn(() => provider),
    getDb: vi.fn(() => database),
    createRepository: vi.fn(() => repository),
    revalidatePath: vi.fn(),
  };
});

vi.mock("@/src/server/auth/supabase", () => ({ createSupabaseAuthProvider: mocks.createAuthProvider }));
vi.mock("@/src/server/db/client", () => ({ getDb: mocks.getDb }));
vi.mock("@/src/server/goals/repository", () => ({
  createGoalsRepository: mocks.createRepository,
  ExerciseAccessLockedError: mocks.ExerciseAccessLockedError,
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }));

import { createLearningGoal, submitPracticeEvaluation } from "@/app/dashboard/actions";

const identity = { issuer: "https://auth.example.test", subject: "verified-subject" };
const exerciseId = "00000000-0000-4000-8000-000000000001";

function form(field: string, value: string | Blob) {
  const data = new FormData();
  data.set(field, value);
  if (field === "description") {
    data.set("startingLevel", "fresher");
  }
  return data;
}

function expectNoWrite() {
  expect(mocks.getDb).not.toHaveBeenCalled();
  expect(mocks.createRepository).not.toHaveBeenCalled();
  expect(mocks.repository.createGoal).not.toHaveBeenCalled();
  expect(mocks.repository.evaluateExercise).not.toHaveBeenCalled();
  expect(mocks.revalidatePath).not.toHaveBeenCalled();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.createAuthProvider.mockReturnValue(mocks.provider);
  mocks.provider.getIdentity.mockResolvedValue(identity);
  mocks.getDb.mockReturnValue(mocks.database);
  mocks.createRepository.mockReturnValue(mocks.repository);
});

describe.each([
  { label: "goal", field: "description", limit: 2000, invoke: createLearningGoal, write: mocks.repository.createGoal, failure: "Unable to save your goal. Please try again." },
  { label: "evaluation", field: "response", limit: 10000, invoke: (data: FormData) => submitPracticeEvaluation(exerciseId, data), write: mocks.repository.evaluateExercise, failure: "Unable to save your response. Please try again." },
])("$label action boundary", ({ field, limit, invoke, write, failure }) => {
  it("rejects an absent identity before reading input or accessing the database", async () => {
    mocks.provider.getIdentity.mockResolvedValueOnce(null);

    await expect(invoke(new FormData())).rejects.toThrow("Please sign in to continue.");
    expectNoWrite();
  });

  it.each(["construction", "lookup"])("sanitizes auth %s failures and performs no write", async (boundary) => {
    const error = new Error("private auth diagnostic");
    if (boundary === "construction") mocks.createAuthProvider.mockImplementationOnce(() => { throw error; });
    else mocks.provider.getIdentity.mockRejectedValueOnce(error);

    await expect(invoke(form(field, "A valid answer"))).rejects.toThrow("Unable to verify your session. Please sign in again.");
    expectNoWrite();
  });

  it.each(["missing", "empty", "whitespace", "file", "duplicate", "too long", "padding"])(
    "rejects %s input before database access",
    async (invalid) => {
      const data = new FormData();
      if (field === "description") data.set("startingLevel", "fresher");
      if (invalid === "empty") data.set(field, "");
      if (invalid === "whitespace") data.set(field, " \n\t ");
      if (invalid === "file") data.set(field, new Blob(["not a text field"]), "answer.txt");
      if (invalid === "duplicate") { data.append(field, "One"); data.append(field, "Two"); }
      if (invalid === "too long") data.set(field, "x".repeat(limit + 1));
      if (invalid === "padding") data.set(field, `x${" ".repeat(limit)}`);

      await expect(invoke(data)).rejects.toThrow(new RegExp(`Invalid ${field}`));
      expectNoWrite();
    },
  );

  it("rejects non-FormData input with a safe validation error", async () => {
    await expect(invoke(null as unknown as FormData)).rejects.toThrow(new RegExp(`Invalid ${field}`));
    expectNoWrite();
  });

  it("accepts the upper bound and invalidates the dashboard only after the write", async () => {
    let finish: () => void = () => {};
    write.mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }));
    const pending = invoke(form(field, "x".repeat(limit)));
    await vi.waitFor(() => expect(write).toHaveBeenCalledOnce());
    expect(mocks.revalidatePath).not.toHaveBeenCalled();

    finish();
    await expect(pending).resolves.toBeUndefined();
    expect(mocks.revalidatePath).toHaveBeenCalledExactlyOnceWith("/dashboard");
  });

  it.each(["database", "repository construction", "write", "non-Error write"])(
    "sanitizes a %s failure and does not invalidate after a failed write",
    async (boundary) => {
      const error = new Error("private database diagnostic");
      if (boundary === "database") mocks.getDb.mockImplementationOnce(() => { throw error; });
      if (boundary === "repository construction") mocks.createRepository.mockImplementationOnce(() => { throw error; });
      if (boundary === "write") write.mockRejectedValueOnce(error);
      if (boundary === "non-Error write") write.mockRejectedValueOnce({ detail: "private database diagnostic" });

      const result = invoke(form(field, "A valid answer"));
      await expect(result).rejects.toThrow(failure);
      await expect(result).rejects.not.toHaveProperty("cause");
      expect(mocks.revalidatePath).not.toHaveBeenCalled();
    },
  );
});

describe("action ownership and normalization", () => {
  it("uses only the validated identity, trimmed goal description, and starting level", async () => {
    const data = form("description", "  Lead a meeting in Spanish. \n");
    data.set("subject", "untrusted-subject");
    data.set("userId", "untrusted-user");

    await createLearningGoal(data);

    expect(mocks.repository.createGoal).toHaveBeenCalledExactlyOnceWith(identity, {
      description: "Lead a meeting in Spanish.",
      startingLevel: "fresher",
    });
    expect(mocks.repository.evaluateExercise).not.toHaveBeenCalled();
  });

  it.each(["beginner", "expert", "unknown", "", "   "])(
    "rejects invalid or unapproved starting level %j before database access",
    async (invalidLevel) => {
      const data = new FormData();
      data.set("description", "A valid goal description");
      data.set("startingLevel", invalidLevel);

      await expect(createLearningGoal(data)).rejects.toThrow("Choose Fresher, Intermediate, or Advanced.");
      expectNoWrite();
    },
  );

  it("uses the bound UUID, validated identity, and trimmed response", async () => {
    const data = form("response", "  A practical response. \n");
    data.set("exerciseId", "untrusted-exercise");
    data.set("userId", "untrusted-user");

    await submitPracticeEvaluation(exerciseId, data);

    expect(mocks.repository.evaluateExercise).toHaveBeenCalledExactlyOnceWith(identity, exerciseId, "A practical response.");
    expect(mocks.repository.createGoal).not.toHaveBeenCalled();
  });

  it.each(["", "not-a-uuid", ` ${exerciseId}`, `${exerciseId}extra`, "x".repeat(10000), null, 42])(
    "rejects malformed exercise IDs before database access (%#)",
    async (id) => {
      await expect(submitPracticeEvaluation(id as string, form("response", "Valid answer"))).rejects.toThrow("Invalid exercise.");
      expectNoWrite();
    },
  );

  it("extracts and passes targetLanguage metadata to createGoal when present", async () => {
    const data = form("description", "Master everyday conversation in Japanese.");
    data.set("targetLanguage", "Japanese");

    await createLearningGoal(data);

    expect(mocks.repository.createGoal).toHaveBeenCalledExactlyOnceWith(identity, {
      description: "Master everyday conversation in Japanese.",
      startingLevel: "fresher",
      targetLanguage: "Japanese",
    });
  });

  it("propagates ExerciseAccessLockedError cleanly without masking as a generic error", async () => {
    mocks.repository.evaluateExercise.mockRejectedValueOnce(
      new mocks.ExerciseAccessLockedError("Exercise is locked. Complete preceding exercises first.")
    );

    const data = form("response", "Attempt on locked exercise");
    await expect(submitPracticeEvaluation(exerciseId, data)).rejects.toThrow(
      "Exercise is locked. Complete preceding exercises first."
    );
    expect(mocks.revalidatePath).not.toHaveBeenCalled();
  });
});
