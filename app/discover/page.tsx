import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Discover for you" };

type Story = {
  id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  category: string | null;
  published_at: string | null;
  cover_image_url: string | null;
  county: string | null;
  language: string | null;
};

type Profile = {
  id: string;
  display_name: string | null;
  username: string | null;
  county: string | null;
  avatar_url: string | null;
};

function freshness(date: string | null) {
  if (!date) return 0.25;
  const ageDays = Math.max(0, (Date.now() - new Date(date).getTime()) / 86_400_000);
  return Math.max(0, 1 - ageDays / 60);
}

export default async function DiscoverPage() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();

  const [storyResult, followResult, bookmarkResult, likeResult, historyResult, blockResult] = await Promise.all([
    db.from("stories")
      .select("id,author_id,title,slug,excerpt,category,published_at,cover_image_url,county,language")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(80),
    user ? db.from("follows").select("followed_id").eq("follower_id", user.id) : Promise.resolve({ data: [] }),
    user ? db.from("bookmarks").select("story_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
    user ? db.from("story_likes").select("story_id").eq("user_id", user.id).order("created_at", { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
    user ? db.from("reading_history").select("story_id,progress_percent").eq("user_id", user.id).order("last_read_at", { ascending: false }).limit(80) : Promise.resolve({ data: [] }),
    user ? db.rpc("get_blocked_member_ids") : Promise.resolve({ data: [] })
  ]);

  const stories = (storyResult.data ?? []) as Story[];
  const storyIds = stories.map((story) => story.id);
  const followed = new Set((followResult.data ?? []).map((row: { followed_id: string }) => row.followed_id));
  const blocked = new Set((blockResult.data ?? []).map((row: { member_id: string }) => row.member_id));
  const savedIds = new Set((bookmarkResult.data ?? []).map((row: { story_id: string }) => row.story_id));
  const likedIds = new Set((likeResult.data ?? []).map((row: { story_id: string }) => row.story_id));
  const readIds = new Set((historyResult.data ?? []).filter((row: { progress_percent: number }) => row.progress_percent >= 20).map((row: { story_id: string }) => row.story_id));
  const priorIds = new Set([...savedIds, ...likedIds, ...readIds]);

  const categoryCounts = new Map<string, number>();
  const priorStoryIds = [...priorIds];
  if (priorStoryIds.length) {
    const { data: priorStories } = await db.from("stories").select("id,category").in("id", priorStoryIds);
    for (const row of priorStories ?? []) {
      if (row.category) categoryCounts.set(row.category, (categoryCounts.get(row.category) ?? 0) + 1);
    }
  }
  const maxCategoryCount = Math.max(1, ...categoryCounts.values());

  const [allLikes, allComments] = storyIds.length ? await Promise.all([
    db.from("story_likes").select("story_id").in("story_id", storyIds).limit(2000),
    db.from("comments").select("story_id").eq("is_hidden", false).in("story_id", storyIds).limit(2000)
  ]) : [{ data: [] }, { data: [] }];
  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  for (const row of allLikes.data ?? []) likeCounts.set(row.story_id, (likeCounts.get(row.story_id) ?? 0) + 1);
  for (const row of allComments.data ?? []) commentCounts.set(row.story_id, (commentCounts.get(row.story_id) ?? 0) + 1);
  const maxEngagement = Math.max(1, ...stories.map((story) => Math.log1p((likeCounts.get(story.id) ?? 0) + (commentCounts.get(story.id) ?? 0))));

  const eligible = stories.filter((story) => !blocked.has(story.author_id));
  const ranked = eligible.map((story) => {
    const categoryAffinity = story.category ? (categoryCounts.get(story.category) ?? 0) / maxCategoryCount : 0;
    const relationship = followed.has(story.author_id) ? 1 : 0;
    const recent = freshness(story.published_at);
    const engagement = Math.log1p((likeCounts.get(story.id) ?? 0) + (commentCounts.get(story.id) ?? 0)) / maxEngagement;
    const exploration = priorIds.has(story.id) ? 0 : 1;
    const score = 0.28 * categoryAffinity + 0.22 * relationship + 0.18 * recent + 0.12 * engagement + 0.20 * exploration;
    const reason = relationship
      ? "From a writer you follow"
      : categoryAffinity > 0
        ? "A form you have enjoyed before"
        : exploration
          ? "A new voice to discover"
          : "Recently published";
    return { story, score, reason };
  }).sort((a, b) => b.score - a.score || new Date(b.story.published_at ?? 0).getTime() - new Date(a.story.published_at ?? 0).getTime());

  // Keep the ranked list varied: no more than two stories from one writer in the first eight.
  const selected: typeof ranked = [];
  const remaining = [...ranked];
  const authorCounts = new Map<string, number>();
  while (remaining.length && selected.length < 24) {
    let index = remaining.findIndex((item) => (authorCounts.get(item.story.author_id) ?? 0) < 2);
    if (index < 0) index = 0;
    const [item] = remaining.splice(index, 1);
    selected.push(item);
    authorCounts.set(item.story.author_id, (authorCounts.get(item.story.author_id) ?? 0) + 1);
  }

  const authorIds = [...new Set(selected.map((item) => item.story.author_id))];
  const { data: profiles } = authorIds.length
    ? await db.from("profiles").select("id,display_name,username,county,avatar_url").in("id", authorIds)
    : { data: [] as Profile[] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));

  return (
    <main className="feature-page">
      <header className="feature-header">
        <Link href="/" className="feature-brand">afrofemme writers.</Link>
        <nav><Link href="/feed">Community feed</Link><Link href="/writers">Find writers</Link><Link href="/stories">Reading lounge</Link>{user && <Link href="/profile">My profile</Link>}</nav>
      </header>
      <section className="feature-intro">
        <span className="eyebrow accent">THE READING LOUNGE · PERSONAL DISCOVERY</span>
        <h1>Find the words<br/><em>waiting for you.</em></h1>
        <p>{user ? "A thoughtful mix shaped by the writers you follow, stories you save and the forms you spend time reading." : "Explore published stories from across the Afrofemme Writers community. Sign in to make discovery more personal."}</p>
        <div className="engagement-quicklinks"><Link href="/feed">Community feed</Link><Link href="/feed?view=following">Writers I follow</Link><Link href="/writers">Discover writers ↗</Link><Link href="/stories">Browse every story ↗</Link></div>
        <p className="feed-tag-filter">Your private messages are never used for recommendations. You can always return to the chronological feed.</p>
      </section>
      <section className="feature-list">
        <div className="feature-list-head"><div><span className="eyebrow accent">A CURATED STARTING POINT</span><h2>Stories picked for discovery</h2></div><span>{selected.length} stories</span></div>
        {!selected.length ? <p className="feature-empty">There are no published stories to recommend yet. <Link href="/stories">Visit the reading lounge</Link> or check back soon.</p> : selected.map(({ story, reason }) => {
          const author = profileMap.get(story.author_id);
          return <article className="feature-card feed-card" key={story.id}>
            <div className="feed-author-row">
              {author?.avatar_url ? <img src={author.avatar_url} alt="" className="feed-avatar"/> : <span className="feed-avatar feed-initial">{(author?.display_name || "A").slice(0, 1).toUpperCase()}</span>}
              <div><strong>{author?.username ? <Link href={"/writers/" + author.username}>{author.display_name || "Community writer"}</Link> : author?.display_name || "Afrofemme writer"}</strong><small>{author?.county || story.county || "Kenya"} · {story.language || "English"}</small></div>
              <span className="feed-kind">{reason}</span>
            </div>
            {story.cover_image_url && <div className="social-post-media"><img src={story.cover_image_url} alt={"Cover for " + story.title}/></div>}
            <h3>{story.title}</h3>
            <p>{story.excerpt || "A published story from the Afrofemme Writers community."}</p>
            <div className="feature-card-meta"><span>{story.category || "Story"}</span><span>{story.published_at ? new Date(story.published_at).toLocaleDateString("en-KE") : "Recently published"}</span></div>
            <Link className="feature-link" href={"/stories/" + story.slug}>Read this story ↗</Link>
          </article>;
        })}
      </section>
    </main>
  );
}
