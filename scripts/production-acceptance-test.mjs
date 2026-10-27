/**
 * SpeakQL Production Acceptance Test
 * 
 * Verifies that a deployed instance is responding, healthy, and enforcing
 * security boundaries across public, protected, and authenticated endpoints.
 * 
 * Usage:
 *   SPEAKQL_BASE_URL="http://localhost:3001" node scripts/production-acceptance-test.mjs
 * 
 * Optional Authenticated Testing:
 *   SPEAKQL_TEST_EMAIL="user@example.com" SPEAKQL_TEST_PASSWORD="password" \
 *   SPEAKQL_BASE_URL="http://localhost:3001" node scripts/production-acceptance-test.mjs
 */

import { createBrowserClient } from '@supabase/ssr';
import dotenv from 'dotenv';
import fs from 'fs';

// Safely load local test environments if available
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}
if (fs.existsSync('.env.test.local')) {
  dotenv.config({ path: '.env.test.local' });
}

const baseUrl = (process.env.SPEAKQL_BASE_URL || process.env.TARGET_URL || "http://localhost:3000").replace(/\/$/, "");
const testEmail = process.env.SPEAKQL_TEST_EMAIL || process.env.TEST_ACCOUNT_EMAIL;
const testPassword = process.env.SPEAKQL_TEST_PASSWORD || process.env.TEST_ACCOUNT_PASSWORD;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function main() {
  console.log(`[Acceptance] Running verification against target: ${baseUrl}`);

  const results = [];

  // 1. Health check endpoint
  try {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const healthBody = await healthRes.json().catch(() => null);
    const healthPassed = healthRes.status === 200 && healthBody?.status === "ok" && healthBody?.service === "speakql";
    results.push({
      gate: "health_endpoint",
      passed: healthPassed,
      status: healthRes.status,
      service: healthBody?.service,
    });
  } catch (err) {
    results.push({ gate: "health_endpoint", passed: false, error: err.message });
  }

  // 2. Public landing page
  try {
    const landingRes = await fetch(`${baseUrl}/`);
    const landingText = await landingRes.text();
    const landingPassed = landingRes.status === 200 && landingText.includes("Speak");
    results.push({
      gate: "landing_page_accessible",
      passed: landingPassed,
      status: landingRes.status,
    });
  } catch (err) {
    results.push({ gate: "landing_page_accessible", passed: false, error: err.message });
  }

  // 3. Login page
  try {
    const loginRes = await fetch(`${baseUrl}/login`);
    const loginText = await loginRes.text();
    const loginPassed = loginRes.status === 200 && loginText.includes("Sign in");
    results.push({
      gate: "login_page_accessible",
      passed: loginPassed,
      status: loginRes.status,
    });
  } catch (err) {
    results.push({ gate: "login_page_accessible", passed: false, error: err.message });
  }

  // 4. Protected route enforcement (unauthenticated dashboard access)
  try {
    const dashRes = await fetch(`${baseUrl}/dashboard`, { redirect: "manual" });
    const dashText = await dashRes.text();
    const redirectsViaHeader = (dashRes.status === 307 || dashRes.status === 302) && (dashRes.headers.get("location")?.includes("/login") ?? false);
    const redirectsViaRsc = dashText.includes("NEXT_REDIRECT") && dashText.includes("/login");
    const showsUnauthScreen = dashRes.status === 200 && (dashText.includes("Sign in to access your learning space") || dashText.includes("LEARNER IDENTITY VERIFICATION"));
    const protectionPassed = redirectsViaHeader || redirectsViaRsc || showsUnauthScreen;

    results.push({
      gate: "unauthenticated_dashboard_protected",
      passed: protectionPassed,
      status: dashRes.status,
      redirectSignal: redirectsViaHeader ? "http_redirect_header" : redirectsViaRsc ? "next_rsc_redirect_digest" : showsUnauthScreen ? "unauthenticated_barrier_screen" : "none",
    });
  } catch (err) {
    results.push({ gate: "unauthenticated_dashboard_protected", passed: false, error: err.message });
  }

  // 5. Unauthenticated API boundary protection (/api/profile)
  try {
    const profileRes = await fetch(`${baseUrl}/api/profile`);
    const profileBody = await profileRes.json().catch(() => null);
    const apiProtected = profileRes.status === 401 && profileBody?.error === "unauthenticated";
    results.push({
      gate: "unauthenticated_api_protected",
      passed: apiProtected,
      status: profileRes.status,
      errorResponse: profileBody?.error,
    });
  } catch (err) {
    results.push({ gate: "unauthenticated_api_protected", passed: false, error: err.message });
  }

  // 6. Authenticated customer journey verification
  if (testEmail && testPassword && supabaseUrl && supabaseAnonKey) {
    const cookies = {};
    const client = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
        setAll: (items) => { items.forEach((i) => { cookies[i.name] = i.value; }); },
      },
    });

    // 6a. Login authentication
    let authPassed = false;
    try {
      const { data: authData, error: authError } = await client.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });
      authPassed = !authError && Boolean(authData?.user?.id);
      results.push({
        gate: "login_succeeds",
        passed: authPassed,
        userIdVerified: authPassed,
      });
    } catch (err) {
      results.push({ gate: "login_succeeds", passed: false, error: err.message });
    }

    if (authPassed) {
      const cookieHeader = Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");

      // 6b. Authenticated dashboard load
      try {
        const authDashRes = await fetch(`${baseUrl}/dashboard`, {
          headers: { cookie: cookieHeader },
          redirect: "manual",
        });
        const authDashText = await authDashRes.text();
        const authDashPassed = authDashRes.status === 200 && !authDashText.includes("NEXT_REDIRECT") && authDashText.includes("SpeakQL");
        results.push({
          gate: "authenticated_dashboard_loads",
          passed: authDashPassed,
          status: authDashRes.status,
        });
      } catch (err) {
        results.push({ gate: "authenticated_dashboard_loads", passed: false, error: err.message });
      }

      // 6c. Authenticated profile endpoint (verified identity, distinct from 401 unauthenticated)
      try {
        const authProfileRes = await fetch(`${baseUrl}/api/profile`, {
          headers: { cookie: cookieHeader },
        });
        // 200 if record exists, 404 if user exists but has not saved a profile row yet. Neither is 401 unauthenticated.
        const authProfilePassed = authProfileRes.status === 200 || authProfileRes.status === 404;
        results.push({
          gate: "authenticated_profile_authorized",
          passed: authProfilePassed,
          status: authProfileRes.status,
        });
      } catch (err) {
        results.push({ gate: "authenticated_profile_authorized", passed: false, error: err.message });
      }

      // 6d. Logout execution
      try {
        const { error: logoutError } = await client.auth.signOut({ scope: "local" });
        results.push({
          gate: "logout_succeeds",
          passed: !logoutError,
        });
      } catch (err) {
        results.push({ gate: "logout_succeeds", passed: false, error: err.message });
      }

      // Clear local cookies to simulate browser after logout
      for (const k of Object.keys(cookies)) {
        delete cookies[k];
      }

      // 6e. Post-logout route protection
      try {
        const postLogoutRes = await fetch(`${baseUrl}/dashboard`, {
          redirect: "manual",
        });
        const postLogoutText = await postLogoutRes.text();
        const postLogoutProtected =
          (postLogoutRes.status === 307 || postLogoutRes.status === 302) ||
          postLogoutText.includes("NEXT_REDIRECT") ||
          (postLogoutRes.status === 200 && (postLogoutText.includes("Sign in to access your learning space") || postLogoutText.includes("LEARNER IDENTITY VERIFICATION")));
        results.push({
          gate: "post_logout_dashboard_protected",
          passed: postLogoutProtected,
          status: postLogoutRes.status,
        });
      } catch (err) {
        results.push({ gate: "post_logout_dashboard_protected", passed: false, error: err.message });
      }
    }
  } else {
    results.push({
      gate: "authenticated_flow",
      passed: true,
      skipped: true,
      reason: "Requires SPEAKQL_TEST_EMAIL and SPEAKQL_TEST_PASSWORD in environment.",
    });
  }

  const allPassed = results.filter((r) => !r.skipped).every((r) => r.passed);

  console.log(JSON.stringify({
    target: baseUrl,
    timestamp: new Date().toISOString(),
    overallPassed: allPassed,
    checks: results,
  }, null, 2));

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("[Acceptance] Test run failed:", err.message);
  process.exit(1);
});
