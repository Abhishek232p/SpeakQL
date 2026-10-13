import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

describe("Secret scanning and credential leakage prevention", () => {
  it("ensures no tracked git files contain hardcoded secrets, private keys, or credentials", () => {
    const output = execSync("git ls-files", { encoding: "utf8" });
    const trackedFiles = output.split("\n").map((f) => f.trim()).filter(Boolean);

    const universalPatterns = [
      /-----BEGIN (RSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
      /AKIA[0-9A-Z]{16}/, // AWS access key
      /AIza[0-9A-Za-z-_]{35}/, // Google API key
      /sk_live_[0-9a-zA-Z]{24}/, // Stripe live key
      /ghp_[0-9a-zA-Z]{36}/, // GitHub personal access token
      /postgres(?:ql)?:\/\/[^:]+:[^@]+@([a-z0-9.-]+\.supabase\.co|aws\.neon\.tech)/i, // Real cloud db urls
    ];

    const sourceOnlyPatterns = [
      /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^/]+/i, // Generic connection strings with passwords in app code
    ];

    const violations: { file: string; match: string }[] = [];

    for (const file of trackedFiles) {
      if (
        file.endsWith(".example") ||
        file === "tests/secret-scan.test.ts" ||
        file.endsWith(".png") ||
        file.endsWith(".webp") ||
        file.endsWith(".ico")
      ) {
        continue;
      }

      const fullPath = path.resolve(process.cwd(), file);
      if (!fs.existsSync(fullPath)) continue;

      const content = fs.readFileSync(fullPath, "utf8");

      for (const pattern of universalPatterns) {
        if (pattern.test(content)) {
          violations.push({ file, match: pattern.toString() });
        }
      }

      // Check application source files (src/ and app/) for any hardcoded connection strings
      if (file.startsWith("src/") || file.startsWith("app/")) {
        for (const pattern of sourceOnlyPatterns) {
          if (pattern.test(content)) {
            violations.push({ file, match: pattern.toString() });
          }
        }
      }
    }

    expect(violations).toEqual([]);
  });

  it("ensures .env and secret files are properly excluded by .gitignore", () => {
    const gitignorePath = path.resolve(process.cwd(), ".gitignore");
    const content = fs.readFileSync(gitignorePath, "utf8");

    expect(content).toContain(".env");
    expect(content).toContain(".env.*");
    expect(content).toContain("*.key");
    expect(content).toContain("*.pem");
  });
});
