import { updateSupabaseSession } from "@/src/server/auth/supabase-proxy";
import type { NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/api/profile/:path*",
  ],
};
