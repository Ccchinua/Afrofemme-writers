import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const store = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase is not configured.");
  }

  return createServerClient(url, key, {
    cookieOptions: {
      // Keep the session cookie persistent when a member closes and reopens the browser.
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(
        values: {
          name: string;
          value: string;
          options?: Parameters<typeof store.set>[2];
        }[]
      ) {
        try {
          values.forEach(({ name, value, options }) => {
            store.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies.
        }
      },
    },
  });
}
