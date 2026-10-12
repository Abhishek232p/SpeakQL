import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { parse } from 'dotenv';
import pg from 'pg';

// Catalog only: never reads user records or emits connection strings.
const env = { ...parse(readFileSync('.env.local')), ...process.env };
if (!env.MIGRATION_DATABASE_URL) throw new Error('Migration connection required');
const client = new pg.Client({ connectionString: env.MIGRATION_DATABASE_URL, connectionTimeoutMillis: 10000 });
const tables = ['users', 'user_profiles', 'audit_events', 'learning_goals', 'competencies', 'practice_exercises', 'practice_evaluations'];
try {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  await client.query("SET LOCAL statement_timeout = '15s'");
  const query = async (text, values = []) => (await client.query(text, values)).rows;
  const historyLocations = await query("select n.nspname, c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relname='__drizzle_migrations' and c.relkind='r'");
  const history = [];
  for (const location of historyLocations) {
    const quote = (value) => '"' + value.replaceAll('"', '""') + '"';
    history.push(...await query(`select hash, created_at from ${quote(location.nspname)}.${quote(location.relname)} order by id`));
  }
  const journal = JSON.parse(readFileSync('drizzle/migrations/meta/_journal.json', 'utf8'));
  const migrations = journal.entries.map((entry) => {
    const hash = createHash('sha256').update(readFileSync(`drizzle/migrations/${entry.tag}.sql`)).digest('hex');
    return { tag: entry.tag, localTimestamp: entry.when, remoteTimestamps: history.filter(row => row.hash === hash).map(row => row.created_at) };
  });
  const result = {
    historyLocations, migrations,
    tables: await query("select c.relname, c.relowner::regrole::text as owner, c.relrowsecurity, c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any($1)", [tables]),
    memberships: await query("select member::regrole::text as member, roleid::regrole::text as role, admin_option from pg_auth_members where member in (select oid from pg_roles where rolname in ('speakql_app','speakql_runtime','anon','authenticated','service_role'))"),
    effectivePrivileges: await query("select r.rolname, t.name, p.operation, has_table_privilege(r.oid, 'public.' || t.name, p.operation) as allowed from pg_roles r cross join unnest($1::text[]) t(name) cross join unnest(array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER']) p(operation) where r.rolname in ('anon','authenticated','service_role','speakql_app','speakql_runtime') order by 1,2,3", [tables]),
    policies: await query("select tablename, policyname, roles, cmd, qual, with_check from pg_policies where schemaname='public' and tablename=any($1) order by 1,2", [tables]),
    definers: await query("select p.oid::regprocedure::text as function, p.proowner::regrole::text as owner, p.prorettype::regtype::text as returns, p.proconfig, has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute, has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prosecdef"),
  };
  console.log(JSON.stringify(result, null, 2));
} catch {
  console.error('Read-only catalog audit failed; connection details suppressed.');
  process.exitCode = 1;
} finally {
  await client.query('ROLLBACK').catch(() => {});
  await client.end();
}
