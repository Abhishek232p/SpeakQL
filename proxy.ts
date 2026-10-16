import { updateSupabaseSession } from "@/src/server/auth/supabase-proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  // For protected dashboard routes, check if auth cookies exist
  if (isDashboard) {
    const authCookies = request.cookies.getAll().filter(c => c.name.includes("sb-") || c.name.includes("supabase") || c.name.includes("session"));
    if (authCookies.length === 0) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("auth_error", "session_required");
      return NextResponse.redirect(loginUrl, 307);
    }
  }

  try {
    return await updateSupabaseSession(request);
  } catch {
    // If session verification fails or throws on protected dashboard routes,
    // redirect smoothly to /login instead of displaying a 500 error page.
    if (isDashboard) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("auth_error", "session_expired");
      return NextResponse.redirect(loginUrl, 307);
    }
    return new NextResponse("Unable to verify your session.", { status: 401 });
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/profile/:path*",
  ],
};
