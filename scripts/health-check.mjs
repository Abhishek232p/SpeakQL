const baseUrl = process.env.SPEAKQL_BASE_URL ?? "http://localhost:3000";
const response = await fetch(`${baseUrl}/api/health`);
const body = await response.json();

if (!response.ok || body.status !== "ok" || body.service !== "speakql") {
  console.error(JSON.stringify({ ok: false, status: response.status, body }));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, body }));
