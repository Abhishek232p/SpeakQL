import { createBrowserClient } from "@supabase/ssr";

type BrowserAuthClient = ReturnType<typeof createBrowserClient>;

/**
 * Creates the browser client from the public Supabase configuration only.
 * Session tokens remain managed by Supabase's browser storage and are never
 * returned by this helper or rendered by the application.
 */
export function createSupabaseBrowserClient(): BrowserAuthClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createBrowserClient(url, key) : null;
}

/**
 * Ends only the current browser session. The result intentionally exposes no
 * provider error details to the UI.
 */
export async function signOutBrowserSession(): Promise<boolean> {
  const client = createSupabaseBrowserClient();
  if (!client) return false;

  try {
    const { error } = await client.auth.signOut({ scope: "local" });
    return !error;
  } catch {
    return false;
  }
}
