import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured. Add its public URL and anon key to .env.local.");
  }

  return createBrowserClient(url, key, {
    cookieOptions: {
      // Keep members signed in across browser restarts; Supabase still controls session validity.
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  });
}
