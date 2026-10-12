import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadDotEnv } from "dotenv";
import pg from "pg";

const { Client } = pg;

const RUNTIME_ROLE = "speakql_runtime";
const MIGRATIONS_DIRECTORY = resolve(process.cwd(), "drizzle/migrations");
const TABLES = [
  "users",
  "user_profiles",
  "audit_events",
  "learning_goals",
  "competencies",
  "practice_exercises",
  "practice_evaluations",
];

const EXPECTED_POLICIES = {
  users: {
    users_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["auth_issuer", "auth_subject"] },
    users_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["auth_issuer", "auth_subject"] },
  },
  user_profiles: {
    profiles_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["users", "auth_issuer", "auth_subject"] },
    profiles_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["users", "auth_issuer", "auth_subject"] },
    profiles_update_own: { cmd: "UPDATE", hasUsing: true, hasWithCheck: true, fragments: ["users", "auth_issuer", "auth_subject"] },
  },
  audit_events: {
    audit_insert_own_profile: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["users", "auth_issuer", "auth_subject", "profile.created", "profile.updated"] },
  },
  learning_goals: {
    goals_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["users", "auth_issuer", "auth_subject"] },
    goals_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["users", "auth_issuer", "auth_subject"] },
    goals_update_own: { cmd: "UPDATE", hasUsing: true, hasWithCheck: true, fragments: ["users", "auth_issuer", "auth_subject"] },
  },
  competencies: {
    competencies_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["learning_goals", "users", "auth_issuer", "auth_subject"] },
    competencies_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["learning_goals", "users", "auth_issuer", "auth_subject"] },
    competencies_update_own: { cmd: "UPDATE", hasUsing: true, hasWithCheck: true, fragments: ["learning_goals", "users", "auth_issuer", "auth_subject"] },
  },
  practice_exercises: {
    exercises_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["competencies", "learning_goals", "users", "auth_issuer", "auth_subject"] },
    exercises_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["competencies", "learning_goals", "users", "auth_issuer", "auth_subject"] },
    exercises_update_own: { cmd: "UPDATE", hasUsing: true, hasWithCheck: true, fragments: ["competencies", "learning_goals", "users", "auth_issuer", "auth_subject"] },
  },
  practice_evaluations: {
    evaluations_select_own: { cmd: "SELECT", hasUsing: true, hasWithCheck: false, fragments: ["practice_exercises", "competencies", "learning_goals", "users", "auth_issuer", "auth_subject"] },
    evaluations_insert_own: { cmd: "INSERT", hasUsing: false, hasWithCheck: true, fragments: ["practice_exercises", "competencies", "learning_goals", "users", "auth_issuer", "auth_subject"] },
  },
};

const EXPECTED_PRIVILEGES = {
  users: { SELECT: true, INSERT: true, UPDATE: false, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  user_profiles: { SELECT: true, INSERT: true, UPDATE: true, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  audit_events: { SELECT: false, INSERT: true, UPDATE: false, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  learning_goals: { SELECT: true, INSERT: true, UPDATE: true, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  competencies: { SELECT: true, INSERT: true, UPDATE: true, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  practice_exercises: { SELECT: true, INSERT: true, UPDATE: true, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
  practice_evaluations: { SELECT: true, INSERT: true, UPDATE: false, DELETE: false, TRUNCATE: false, REFERENCES: false, TRIGGER: false },
};

class HarnessBlockedError extends Error {}
class CheckFailure extends Error {}

function assert(condition, message) {
  if (!condition) throw new CheckFailure(message);
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new HarnessBlockedError(`${name} is required; no database connection was attempted.`);
  return value;
}

function parseDatabaseUrl(name, value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new HarnessBlockedError(`${name} must be a PostgreSQL URI; no database connection was attempted.`);
  }

  if (!(["postgres:", "postgresql:"].includes(url.protocol) && url.hostname && url.username && url.pathname.length > 1)) {
    throw new HarnessBlockedError(`${name} must include a PostgreSQL protocol, user, host, and database name; no database connection was attempted.`);
  }

  let username;
  let database;
  try {
    username = decodeURIComponent(url.username);
    database = decodeURIComponent(url.pathname.slice(1));
  } catch {
    throw new HarnessBlockedError(`${name} contains invalid encoded connection fields; no database connection was attempted.`);
  }

  if (isProductionLikeDatabaseName(database)) {
    throw new HarnessBlockedError(`${name} resembles a production database; no database connection was attempted.`);
  }

  return {
    name,
    value,
    username,
    database,
    target: `${url.protocol}//${url.hostname.toLowerCase()}:${url.port || "5432"}/${database}`,
  };
}

function isProductionLikeDatabaseName(name) {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  return /(^|_)(prod|production|live|primary|main)(_|$)/.test(normalized);
}

function validateDisposableMarker(marker) {
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(marker)) {
    throw new HarnessBlockedError("SPEAKQL_SECURITY_TEST_DISPOSABLE_MARKER must be a short non-secret marker; no database connection was attempted.");
  }
}

function localMigrationManifest() {
  let journal;
  try {
    journal = JSON.parse(readFileSync(resolve(MIGRATIONS_DIRECTORY, "meta/_journal.json"), "utf8"));
  } catch {
    throw new HarnessBlockedError("The local Drizzle migration journal could not be read; no database mutation was attempted.");
  }
  assert(Array.isArray(journal.entries) && journal.entries.length > 0, "The local Drizzle migration journal is empty.");
  return journal.entries.map((entry) => {
    assert(typeof entry.tag === "string" && /^[A-Za-z0-9_-]+$/.test(entry.tag), "The local migration journal contains an unsafe migration tag.");
    const path = resolve(MIGRATIONS_DIRECTORY, `${entry.tag}.sql`);
    let sql;
    try {
      sql = readFileSync(path);
    } catch {
      throw new HarnessBlockedError(`The local migration ${entry.tag} could not be read; no database mutation was attempted.`);
    }
    return {
      tag: entry.tag,
      localTimestamp: entry.when,
      hash: createHash("sha256").update(sql).digest("hex"),
    };
  });
}

function errorCode(error) {
  return typeof error === "object" && error !== null && "code" in error && typeof error.code === "string" ? error.code : "unknown";
}

function safeDatabaseError(error) {
  const code = errorCode(error);
  return code === "unknown" ? "database operation failed" : `database operation failed (${code})`;
}

function loadEnvironment() {
  const result = loadDotEnv({ path: resolve(process.cwd(), ".env.local"), override: false, quiet: true });
  if (result.error && result.error.code !== "ENOENT") {
    throw new HarnessBlockedError("Unable to read .env.local; no database connection was attempted.");
  }
}

async function connect(spec) {
  const client = new Client({ connectionString: spec.value, application_name: "speakql-phase2-security-test" });
  try {
    await client.connect();
    return client;
  } catch (error) {
    await client.end().catch(() => undefined);
    throw new HarnessBlockedError(`${spec.name} could not connect (${errorCode(error)}).`);
  }
}

async function rollback(client) {
  await client.query("ROLLBACK").catch(() => undefined);
}

async function connectionInfo(client, spec) {
  try {
    const { rows } = await client.query(
      `select session_user, current_user, current_database(),
              login.rolcanlogin, login.rolsuper, login.rolbypassrls,
              login.rolcreatedb, login.rolcreaterole, login.rolreplication,
              pg_catalog.pg_has_role(login.oid, runtime.oid, 'MEMBER') as is_runtime_member,
              not exists (
                select 1
                from pg_catalog.pg_auth_members membership
                where membership.member = runtime.oid
                   or (membership.member = login.oid
                       and (membership.roleid <> runtime.oid or membership.admin_option))
              ) as restricted_memberships
       from pg_catalog.pg_roles login
       join pg_catalog.pg_roles runtime on runtime.rolname = $1
       where login.rolname = session_user`,
      [RUNTIME_ROLE],
    );
    const row = rows[0];
    assert(row, `${spec.name} cannot inspect its runtime-role membership; access was denied.`);
    assert(row.session_user === spec.username, `${spec.name} connected as an unexpected database identity.`);
    assert(row.current_user === spec.username, `${spec.name} started with an unexpected current role.`);
    assert(row.rolcanlogin === true, `${spec.name} is not a LOGIN role.`);
    for (const flag of ["rolsuper", "rolbypassrls", "rolcreatedb", "rolcreaterole", "rolreplication"]) {
      assert(row[flag] === false, `${spec.name} has unsafe role privilege ${flag}.`);
    }
    assert(row.is_runtime_member === true, `${spec.name} is not a member of ${RUNTIME_ROLE}.`);
    assert(row.restricted_memberships === true, `${spec.name} or ${RUNTIME_ROLE} has an unexpected role membership.`);
    return { database: row.current_database, sessionUser: row.session_user };
  } catch (error) {
    if (error instanceof CheckFailure || error instanceof HarnessBlockedError) throw error;
    throw new HarnessBlockedError(`${spec.name} preflight failed: ${safeDatabaseError(error)}.`);
  }
}

async function assertRuntimeRole(client, spec) {
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE "${RUNTIME_ROLE}"`);
    const { rows } = await client.query("select current_user, session_user");
    assert(rows[0]?.current_user === RUNTIME_ROLE, `${spec.name} could not assume ${RUNTIME_ROLE}.`);
    assert(rows[0]?.session_user === spec.username, `${spec.name} changed its session identity unexpectedly.`);
    await client.query("ROLLBACK");
  } catch (error) {
    await rollback(client);
    if (error instanceof CheckFailure || error instanceof HarnessBlockedError) throw error;
    throw new HarnessBlockedError(`${spec.name} cannot SET ROLE ${RUNTIME_ROLE}: ${safeDatabaseError(error)}.`);
  }
}

async function inspectTarget(admin, runtimeClients, specs) {
  let adminInfo;
  try {
    const result = await admin.query("select session_user, current_user, current_database()");
    adminInfo = result.rows[0];
    assert(adminInfo, "The fixture administrator returned no connection identity.");
    assert(adminInfo.session_user === specs.admin.username, "The fixture administrator connected as an unexpected database identity.");
    assert(adminInfo.current_user === adminInfo.session_user, "The fixture administrator started under an unexpected role.");
    assert(![specs.alice.username, specs.bob.username, RUNTIME_ROLE].includes(adminInfo.session_user), "The fixture administrator must be separate from both runtime identities.");

    const runtime = await admin.query(
      `select rolcanlogin, rolinherit, rolsuper, rolbypassrls, rolcreatedb, rolcreaterole, rolreplication
       from pg_catalog.pg_roles where rolname = $1`,
      [RUNTIME_ROLE],
    );
    const role = runtime.rows[0];
    assert(role, `${RUNTIME_ROLE} does not exist.`);
    for (const flag of ["rolcanlogin", "rolinherit", "rolsuper", "rolbypassrls", "rolcreatedb", "rolcreaterole", "rolreplication"]) {
      assert(role[flag] === false, `${RUNTIME_ROLE} has unsafe role attribute ${flag}.`);
    }

    const tables = await admin.query(
      `select c.relname, c.relrowsecurity, c.relforcerowsecurity
       from pg_catalog.pg_class c
       join pg_catalog.pg_namespace n on n.oid = c.relnamespace
       where n.nspname = 'public' and c.relname = any($1::text[])`,
      [TABLES],
    );
    const tableByName = new Map(tables.rows.map((row) => [row.relname, row]));
    for (const table of TABLES) {
      const row = tableByName.get(table);
      assert(row, `Required table public.${table} is missing.`);
      assert(row.relrowsecurity === true, `RLS is not enabled on public.${table}.`);
      assert(row.relforcerowsecurity === true, `FORCE RLS is not enabled on public.${table}.`);
    }

    const policies = await admin.query(
      `select tablename, policyname
       from pg_catalog.pg_policies
       where schemaname = 'public' and tablename = any($1::text[])
       order by tablename, policyname`,
      [TABLES],
    );
    const policyNames = new Map();
    for (const row of policies.rows) {
      const names = policyNames.get(row.tablename) ?? [];
      names.push(row.policyname);
      policyNames.set(row.tablename, names);
    }
    for (const table of TABLES) {
      const actual = [...(policyNames.get(table) ?? [])].sort();
      const expected = [...EXPECTED_POLICIES[table]].sort();
      assert(JSON.stringify(actual) === JSON.stringify(expected), `Unexpected RLS policies exist on public.${table}.`);
    }

    const privileges = await admin.query(
      `select table_name,
              has_table_privilege($1, 'public.' || table_name, 'SELECT') as can_select,
              has_table_privilege($1, 'public.' || table_name, 'INSERT') as can_insert,
               case when table_name = 'user_profiles'
                 then has_column_privilege($1, 'public.user_profiles', 'display_name', 'UPDATE')
                   and has_column_privilege($1, 'public.user_profiles', 'locale', 'UPDATE')
                   and has_column_privilege($1, 'public.user_profiles', 'timezone', 'UPDATE')
                   and has_column_privilege($1, 'public.user_profiles', 'updated_at', 'UPDATE')
                   and not has_column_privilege($1, 'public.user_profiles', 'user_id', 'UPDATE')
                   and not has_column_privilege($1, 'public.user_profiles', 'created_at', 'UPDATE')
                 else has_table_privilege($1, 'public.' || table_name, 'UPDATE') end as can_update,
              has_table_privilege($1, 'public.' || table_name, 'DELETE') as can_delete,
              has_table_privilege($1, 'public.' || table_name, 'TRUNCATE') as can_truncate
       from (values
         ('users'), ('user_profiles'), ('audit_events'), ('learning_goals'),
         ('competencies'), ('practice_exercises'), ('practice_evaluations')
       ) as expected(table_name)`,
      [RUNTIME_ROLE],
    );
    for (const row of privileges.rows) {
      const expected = EXPECTED_PRIVILEGES[row.table_name];
      assert(expected, `Unexpected privilege probe table ${row.table_name}.`);
      for (const [operation, expectedValue] of Object.entries(expected)) {
        assert(row[`can_${operation}`] === expectedValue, `${RUNTIME_ROLE} has an unexpected ${operation.toUpperCase()} privilege on public.${row.table_name}.`);
      }
    }
    assert(privileges.rows.length === TABLES.length, "The runtime privilege probe did not cover every application table.");

    const runtimeDb = await admin.query(
      `select has_database_privilege($1, current_database(), 'CONNECT') as can_connect,
              has_database_privilege($1, current_database(), 'CREATE') as can_create,
              has_schema_privilege($1, 'public', 'USAGE') as schema_usage,
              has_schema_privilege($1, 'public', 'CREATE') as schema_create`,
      [RUNTIME_ROLE],
    );
    const rights = runtimeDb.rows[0];
    assert(rights?.can_connect === true && rights.schema_usage === true, `${RUNTIME_ROLE} lacks required database/schema access.`);
    assert(rights.can_create === false && rights.schema_create === false, `${RUNTIME_ROLE} can create database or schema objects.`);

    const adminRights = await admin.query(
      `select has_table_privilege($1, 'public.users', 'INSERT') as can_insert_users,
              has_table_privilege($1, 'public.user_profiles', 'INSERT') as can_insert_profiles,
              has_table_privilege($1, 'public.learning_goals', 'INSERT') as can_insert_goals,
              has_table_privilege($1, 'public.competencies', 'INSERT') as can_insert_competencies,
              has_table_privilege($1, 'public.practice_exercises', 'INSERT') as can_insert_exercises,
              has_table_privilege($1, 'public.users', 'DELETE') as can_delete_users`,
      [adminInfo.current_user],
    );
    for (const [name, value] of Object.entries(adminRights.rows[0] ?? {})) {
      if (name.startsWith("can_insert_") || name === "can_delete_users") assert(value === true, `Fixture administrator lacks ${name}.`);
    }

    for (const [spec, client] of [[specs.alice, runtimeClients.alice], [specs.bob, runtimeClients.bob]]) {
      await assertRuntimeRole(client, spec);
    }

    return { database: adminInfo.current_database, adminUser: adminInfo.current_user };
  } catch (error) {
    if (error instanceof CheckFailure || error instanceof HarnessBlockedError) throw error;
    throw new HarnessBlockedError(`Target preflight failed: ${safeDatabaseError(error)}.`);
  }
}

async function insertId(client, statement, params, description) {
  const result = await client.query(statement, params);
  const id = result.rows[0]?.id;
  assert(typeof id === "string", `${description} did not return an id.`);
  return id;
}

async function createBranch(admin, issuer, subject, marker, label) {
  const userId = await insertId(
    admin,
    "insert into public.users (auth_issuer, auth_subject) values ($1, $2) returning id",
    [issuer, subject],
    `${label} user`,
  );
  await admin.query(
    "insert into public.user_profiles (user_id, display_name) values ($1, $2)",
    [userId, `${marker}-${label}-profile`],
  );
  const goalId = await insertId(
    admin,
    "insert into public.learning_goals (user_id, description) values ($1, $2) returning id",
    [userId, `${marker}-${label}-goal`],
    `${label} goal`,
  );
  const competencyId = await insertId(
    admin,
    "insert into public.competencies (goal_id, description) values ($1, $2) returning id",
    [goalId, `${marker}-${label}-competency`],
    `${label} competency`,
  );
  const exerciseId = await insertId(
    admin,
    "insert into public.practice_exercises (competency_id, scenario_prompt, expected_structure) values ($1, $2, $3) returning id",
    [competencyId, `${marker}-${label}-prompt`, `${marker}-${label}-expected`],
    `${label} exercise`,
  );
  return {
    identity: { issuer, subject },
    userId,
    profileName: `${marker}-${label}-profile`,
    goalId,
    goalDescription: `${marker}-${label}-goal`,
    competencyId,
    competencyDescription: `${marker}-${label}-competency`,
    exerciseId,
  };
}

async function setupFixtures(admin, disposableMarker) {
  const runId = randomUUID();
  const marker = `phase2-security-${disposableMarker}-${runId}`;
  const issuer = `https://speakql.test/security/${runId}`;
  const subjects = { alice: `phase2-${runId}-alice`, bob: `phase2-${runId}-bob` };

  try {
    await admin.query("BEGIN");
    const alice = await createBranch(admin, issuer, subjects.alice, marker, "alice");
    const bob = await createBranch(admin, issuer, subjects.bob, marker, "bob");
    await admin.query("COMMIT");
    return { runId, marker, issuer, subjects, alice, bob };
  } catch (error) {
    await rollback(admin);
    throw error;
  }
}

async function setContext(client, identity) {
  await client.query(
    `select pg_catalog.set_config('search_path', 'pg_catalog, public, pg_temp', true),
            pg_catalog.set_config('row_security', 'on', true),
            pg_catalog.set_config('speakql.auth_issuer', $1, true),
            pg_catalog.set_config('speakql.auth_subject', $2, true)`,
    [identity.issuer, identity.subject],
  );
}

async function clearContext(client) {
  await client.query(
    `select pg_catalog.set_config('search_path', 'pg_catalog, public, pg_temp', true),
            pg_catalog.set_config('row_security', 'on', true),
            pg_catalog.set_config('speakql.auth_issuer', '', true),
            pg_catalog.set_config('speakql.auth_subject', '', true)`,
  );
}

async function withRuntimeTransaction(client, identity, operation) {
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE "${RUNTIME_ROLE}"`);
    if (identity) await setContext(client, identity);
    else await clearContext(client);
    const result = await operation(client);
    await client.query("ROLLBACK");
    return result;
  } catch (error) {
    await rollback(client);
    throw error;
  }
}

async function expectRlsDenied(promise, label) {
  try {
    await promise;
  } catch (error) {
    if (error instanceof CheckFailure || error instanceof HarnessBlockedError) throw error;
    assert(errorCode(error) === "42501", `${label} failed with an unexpected database error.`);
    return;
  }
  throw new CheckFailure(`${label} unexpectedly succeeded.`);
}

function assertOnlyVisible(rows, expectedId, key, label) {
  assert(rows.length === 1 && rows[0][key] === expectedId, `${label} returned a foreign or missing row.`);
}

async function verifyOwnershipIsolation(runtimeClients, fixture) {
  for (const [label, client, branch, foreign] of [
    ["Alice", runtimeClients.alice, fixture.alice, fixture.bob],
    ["Bob", runtimeClients.bob, fixture.bob, fixture.alice],
  ]) {
    await withRuntimeTransaction(client, branch.identity, async (tx) => {
      const users = await tx.query("select id from public.users where id in ($1, $2) order by id", [branch.userId, foreign.userId]);
      assertOnlyVisible(users.rows, branch.userId, "id", `${label} user ownership probe`);

      const profiles = await tx.query("select user_id from public.user_profiles where user_id in ($1, $2) order by user_id", [branch.userId, foreign.userId]);
      assertOnlyVisible(profiles.rows, branch.userId, "user_id", `${label} profile ownership probe`);

      const goals = await tx.query("select id from public.learning_goals where id in ($1, $2) order by id", [branch.goalId, foreign.goalId]);
      assertOnlyVisible(goals.rows, branch.goalId, "id", `${label} goal ownership probe`);

      const exercises = await tx.query("select id from public.practice_exercises where id in ($1, $2) order by id", [branch.exerciseId, foreign.exerciseId]);
      assertOnlyVisible(exercises.rows, branch.exerciseId, "id", `${label} exercise ownership probe`);
    });
  }
}

async function verifyMissingIdentityContext(client, fixture) {
  await withRuntimeTransaction(client, null, async (tx) => {
    const settings = await tx.query(
      "select current_setting('speakql.auth_issuer', true) as issuer, current_setting('speakql.auth_subject', true) as subject",
    );
    assert(settings.rows[0]?.issuer === "" && settings.rows[0]?.subject === "", "Missing identity context was not empty.");

    const visibleUsers = await tx.query("select id from public.users where id = $1", [fixture.alice.userId]);
    assert(visibleUsers.rows.length === 0, "A missing identity context exposed a user row.");
    const visibleGoals = await tx.query("select id from public.learning_goals where id = $1", [fixture.alice.goalId]);
    assert(visibleGoals.rows.length === 0, "A missing identity context exposed a goal row.");

    await expectRlsDenied(
      tx.query(
        "insert into public.learning_goals (user_id, description) values ($1, $2)",
        [fixture.alice.userId, `${fixture.marker}-missing-context`],
      ),
      "Missing-context goal creation",
    );
  });
}

async function verifyUnauthorizedEvaluation(client, fixture) {
  await withRuntimeTransaction(client, fixture.bob.identity, async (tx) => {
    await expectRlsDenied(
      tx.query(
        `insert into public.practice_evaluations
           (exercise_id, user_id, user_response, feedback, score)
         values ($1, $2, $3, $4, $5)`,
        [fixture.alice.exerciseId, fixture.bob.userId, `${fixture.marker}-response`, "not authorized", "needs_work"],
      ),
      "Cross-owner evaluation creation",
    );
  });
}

async function verifyTransactionRollback(client, admin, fixture) {
  const rollbackDescription = `${fixture.marker}-rollback-goal`;
  try {
    await client.query("BEGIN");
    await client.query(`SET LOCAL ROLE "${RUNTIME_ROLE}"`);
    await setContext(client, fixture.alice.identity);
    const inserted = await client.query(
      "insert into public.learning_goals (user_id, description) values ($1, $2) returning id",
      [fixture.alice.userId, rollbackDescription],
    );
    assert(inserted.rows[0]?.id, "Rollback probe could not insert its disposable row.");

    let divisionError;
    try {
      await client.query("select 1 / 0");
    } catch (error) {
      divisionError = error;
    }
    assert(errorCode(divisionError) === "22012", "Rollback probe did not reach its intentional failure.");
    await rollback(client);
  } catch (error) {
    await rollback(client);
    throw error;
  }

  const remaining = await admin.query("select count(*)::int as count from public.learning_goals where description = $1", [rollbackDescription]);
  assert(Number(remaining.rows[0]?.count) === 0, "A failed transaction left its disposable row committed.");
}

async function cleanupFixtures(admin, fixture) {
  try {
    await admin.query("BEGIN");
    const deleted = await admin.query(
      "delete from public.users where auth_issuer = $1 and auth_subject = any($2::text[]) returning id",
      [fixture.issuer, [fixture.subjects.alice, fixture.subjects.bob]],
    );
    assert(deleted.rowCount === 2, "Fixture cleanup did not delete exactly two test identities.");
    await admin.query("COMMIT");

    const remaining = await admin.query(
      `select
         (select count(*) from public.users where auth_issuer = $1 and auth_subject = any($2::text[]))
       + (select count(*) from public.learning_goals where description = any($3::text[]))
       + (select count(*) from public.competencies where description = any($4::text[]))
       + (select count(*) from public.practice_exercises where scenario_prompt = any($5::text[])) as count`,
      [
        fixture.issuer,
        [fixture.subjects.alice, fixture.subjects.bob],
        [fixture.alice.goalDescription, fixture.bob.goalDescription],
        [fixture.alice.competencyDescription, fixture.bob.competencyDescription],
        [`${fixture.marker}-alice-prompt`, `${fixture.marker}-bob-prompt`],
      ],
    );
    assert(Number(remaining.rows[0]?.count) === 0, "Fixture cleanup left rows behind.");
  } catch (error) {
    await rollback(admin);
    throw error;
  }
}

async function closeClient(client) {
  if (client) await client.end().catch(() => undefined);
}

async function main() {
  loadEnvironment();
  if (process.env.SPEAKQL_SECURITY_TEST_ALLOW_MUTATION !== "1") {
    throw new HarnessBlockedError("Set SPEAKQL_SECURITY_TEST_ALLOW_MUTATION=1 only for a disposable target; no database connection was attempted.");
  }
  const disposableMarker = requiredEnvironment("SPEAKQL_SECURITY_TEST_DISPOSABLE_MARKER");
  validateDisposableMarker(disposableMarker);
  localMigrationManifest();

  const specs = {
    admin: parseDatabaseUrl("SPEAKQL_SECURITY_TEST_ADMIN_DATABASE_URL", requiredEnvironment("SPEAKQL_SECURITY_TEST_ADMIN_DATABASE_URL")),
    alice: parseDatabaseUrl("SPEAKQL_SECURITY_TEST_ALICE_DATABASE_URL", requiredEnvironment("SPEAKQL_SECURITY_TEST_ALICE_DATABASE_URL")),
    bob: parseDatabaseUrl("SPEAKQL_SECURITY_TEST_BOB_DATABASE_URL", requiredEnvironment("SPEAKQL_SECURITY_TEST_BOB_DATABASE_URL")),
  };
  assert(specs.alice.username !== specs.bob.username, "Alice and Bob must use separate database login identities.");
  assert(![specs.alice.username, specs.bob.username].includes(specs.admin.username), "The fixture administrator must use a third database login identity.");
  assert(specs.alice.username !== RUNTIME_ROLE && specs.bob.username !== RUNTIME_ROLE, "Runtime test URLs must be LOGIN roles, not the NOLOGIN group role.");
  assert(specs.admin.target === specs.alice.target && specs.admin.target === specs.bob.target, "All three URLs must target the same disposable database.");

  let admin;
  let alice;
  let bob;
  let fixture;
  let cleanupError;
  try {
    admin = await connect(specs.admin);
    alice = await connect(specs.alice);
    bob = await connect(specs.bob);
    const runtimeClients = { alice, bob };
    const targets = await Promise.all([
      connectionInfo(alice, specs.alice),
      connectionInfo(bob, specs.bob),
    ]);
    const adminTarget = await inspectTarget(admin, runtimeClients, specs);
    assert(targets.every((target) => target.database === adminTarget.database), "Connections did not resolve to one database.");

    fixture = await setupFixtures(admin, disposableMarker);
    await verifyOwnershipIsolation(runtimeClients, fixture);
    await verifyMissingIdentityContext(bob, fixture);
    await verifyUnauthorizedEvaluation(bob, fixture);
    await verifyTransactionRollback(alice, admin, fixture);
  } catch (error) {
    if (error instanceof HarnessBlockedError || error instanceof CheckFailure) throw error;
    throw new HarnessBlockedError(safeDatabaseError(error));
  } finally {
    if (fixture) {
      try {
        await cleanupFixtures(admin, fixture);
      } catch (error) {
        cleanupError = error;
      }
    }
    await closeClient(bob);
    await closeClient(alice);
    await closeClient(admin);
    if (cleanupError) throw new HarnessBlockedError(`Fixture cleanup failed (${errorCode(cleanupError)}); inspect the disposable target before reuse.`);
  }
  console.log("SpeakQL Phase 2 security integration: PASS");
  console.log("Verified restricted runtime role, two-login ownership isolation, missing-context denial, unauthorized evaluation denial, real rollback, and fixture cleanup.");
}

try {
  await main();
} catch (error) {
  if (error instanceof HarnessBlockedError || error instanceof CheckFailure) {
    console.error(`BLOCKED: ${error.message}`);
  } else {
    console.error("BLOCKED: security integration harness failed without exposing database diagnostics.");
  }
  process.exitCode = 2;
}
