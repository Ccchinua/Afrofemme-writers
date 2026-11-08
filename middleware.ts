import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PRIVATE_OR_AUTH_ROUTES = [
  "/admin",
  "/auth/callback",
  "/community",
  "/dashboard",
  "/feed",
  "/forgot-password",
  "/inbox",
  "/journey",
  "/login",
  "/member",
  "/notifications",
  "/profile",
  "/reading-list",
  "/reset-password",
  "/signup",
] as const;

function shouldPreventIndexing(pathname: string) {
  return (
    PRIVATE_OR_AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    ) || /^\/prompts\/[^/]+\/respond\/?$/.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const preventIndexing = shouldPreventIndexing(request.nextUrl.pathname);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (preventIndexing) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookieOptions: {
      // Keep refreshed auth cookies persistent across browser restarts.
      maxAge: 60 * 60 * 24 * 400,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },

      setAll(
        values: {
          name: string;
          value: string;
          options?: Parameters<typeof response.cookies.set>[2];
        }[]
      ) {
        values.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });

        response = NextResponse.next({ request });

        values.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh and validate the member session on each request.
  await supabase.auth.getUser();

  // Member-only and authentication routes must not appear in public search indexes.
  // Apply this after session refresh because setAll may replace the response object.
  if (preventIndexing) {
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
