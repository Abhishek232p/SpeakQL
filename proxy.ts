import { updateSupabaseSession } from "@/src/server/auth/supabase-proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  try {
    return await updateSupabaseSession(request);
  } catch {
    // If session verification fails or throws on protected dashboard routes,
    // redirect smoothly to /login instead of displaying a 500 error page.
    if (request.nextUrl.pathname.startsWith("/dashboard")) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("auth_error", "session_expired");
      return NextResponse.redirect(loginUrl);
    }
    return new NextResponse("Unable to verify your session.", { status: 401 });
  }
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/api/profile/:path*",
  ],
};
