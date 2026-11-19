import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const STATIC_PAGES = [
  "",
  "/stories",
  "/annual",
  "/challenges",
  "/voices",
  "/writers",
  "/spotlight",
  "/events",
  "/gatherings",
  "/privacy",
  "/terms",
  "/community-guidelines",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = (process.env.NEXT_PUBLIC_SITE_URL || "https://afrofemme-writers.vercel.app").replace(/\/+$/, "");
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: base + path,
    lastModified: now,
    changeFrequency:
      path === "/stories" || path === "/annual" || path === "/challenges"
        ? "daily"
        : "weekly",
    priority: path === "" ? 1 : path === "/stories" || path === "/annual" ? 0.9 : 0.4,
  }));

  try {
    const db = await createClient();
    const [storiesResult, writersResult] = await Promise.all([
      db
        .from("stories")
        .select("slug,published_at")
        .eq("status", "published")
        .not("slug", "is", null)
        .order("published_at", { ascending: false })
        .limit(1000),
      db
        .from("profiles")
        .select("username,updated_at")
        .not("username", "is", null)
        .order("updated_at", { ascending: false })
        .limit(1000),
    ]);

    const storyEntries: MetadataRoute.Sitemap = (storiesResult.data ?? [])
      .filter((story) => typeof story.slug === "string" && story.slug.trim().length > 0)
      .map((story) => ({
        url: base + "/stories/" + encodeURIComponent(story.slug),
        lastModified: story.published_at ? new Date(story.published_at) : now,
        changeFrequency: "monthly",
        priority: 0.7,
      }));

    const writerEntries: MetadataRoute.Sitemap = (writersResult.data ?? [])
      .filter((writer) => typeof writer.username === "string" && writer.username.trim().length > 0)
      .map((writer) => ({
        url: base + "/writers/" + encodeURIComponent(writer.username),
        lastModified: writer.updated_at ? new Date(writer.updated_at) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));

    return [...staticEntries, ...storyEntries, ...writerEntries];
  } catch {
    // Keep the stable public sitemap available if Supabase is temporarily unreachable.
    return staticEntries;
  }
}
