import { updateSupabaseSession } from "@/src/server/auth/supabase-proxy";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");

  try {
    return await updateSupabaseSession(request);
  } catch {
    if (isDashboard) {
      return NextResponse.next();
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
