import { execSync } from "node:child_process";

const isCloudflare = Boolean(
  process.env.CF_PAGES ||
  process.env.CLOUDFLARE ||
  process.env.WRANGLER ||
  process.env.CF_WORKER ||
  (process.env.HOME && process.env.HOME.includes("buildhome")) ||
  (process.cwd && process.cwd().includes("buildhome")) ||
  (process.platform === "linux" &&
    !process.env.VERCEL &&
    !process.env.NETLIFY &&
    !process.env.GITHUB_ACTIONS)
);

const target = isCloudflare
  ? "Cloudflare Workers (OpenNext)"
  : "Standard Node/Vercel (Next.js)";

console.log(`[SpeakQL Build] Target platform: ${target}`);

if (isCloudflare) {
  console.log("[SpeakQL Build] Executing OpenNext Cloudflare compilation...");
  // Fail the build if OpenNext fails. A successful Next.js fallback does not
  // produce the Cloudflare worker bundle and must not allow deployment to continue.
  execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
} else {
  console.log("[SpeakQL Build] Executing standard Next.js production build...");
  execSync("npx next build", { stdio: "inherit" });
}
