'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOutBrowserSession } from "@/src/client/auth/supabase";

export default function LogoutButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "signing-out" | "error">("idle");

  async function handleLogout() {
    setState("signing-out");
    const signedOut = await signOutBrowserSession();
    if (!signedOut) {
      setState("error");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  const isSigningOut = state === "signing-out";

  return (
    <div className="logout-control">
      <button
        type="button"
        className="nav-cta logout-button"
        onClick={handleLogout}
        disabled={isSigningOut}
        aria-busy={isSigningOut}
      >
        {isSigningOut ? "Signing out…" : "Sign out"}
      </button>
      {state === "error" && (
        <p className="logout-error" role="alert">
          We couldn&apos;t sign you out. Please try again.
        </p>
      )}
    </div>
  );
}
