import { defineConfig } from "drizzle-kit";
import { loadMigrationDatabaseUrl } from "./scripts/database-config";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: { url: loadMigrationDatabaseUrl() },
});
