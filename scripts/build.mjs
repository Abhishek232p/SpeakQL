import { execSync } from "node:child_process";

const isCloudflare = Boolean(
  process.env.CF_PAGES ||
  process.env.CLOUDFLARE ||
  process.env.WRANGLER ||
  process.env.NODE_ENV === "production" && !process.env.VERCEL && process.platform === "linux"
);

console.log(`[SpeakQL Build] Target platform: ${isCloudflare ? "Cloudflare Workers (OpenNext)" : "Standard Node/Vercel (Next.js)"}`);

if (isCloudflare) {
  try {
    console.log("[SpeakQL Build] Executing OpenNext Cloudflare compilation...");
    execSync("npx opennextjs-cloudflare build", { stdio: "inherit" });
  } catch (err) {
    console.warn("[SpeakQL Build] OpenNext build encountered an error, attempting standard next build fallback...", err);
    execSync("npx next build", { stdio: "inherit" });
  }
} else {
  console.log("[SpeakQL Build] Executing standard Next.js production build...");
  execSync("npx next build", { stdio: "inherit" });
}
