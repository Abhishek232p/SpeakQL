import { execSync } from "node:child_process";

// Prevent recursive build loops: if OpenNext has initiated standalone compilation
// or marked this invocation as a child build, immediately execute standard Next.js build.
if (
  process.env.NEXT_PRIVATE_STANDALONE === "true" ||
  process.env.OPENNEXT_CHILD_BUILD === "1"
) {
  console.log("[SpeakQL Build] Child Next.js compilation step running...");
  execSync("npx next build", { stdio: "inherit" });
  process.exit(0);
}

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
  // Pass recursion guard flag to child processes
  execSync("npx opennextjs-cloudflare build", {
    stdio: "inherit",
    env: { ...process.env, OPENNEXT_CHILD_BUILD: "1" },
  });
} else {
  console.log("[SpeakQL Build] Executing standard Next.js production build...");
  execSync("npx next build", { stdio: "inherit" });
}
