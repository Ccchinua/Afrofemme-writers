import Link from "next/link";
import { ArrowUpRight, Bell, BookOpen, Compass, Feather, Heart, Home as HomeIcon, ImagePlus, MessageCircle, Mic2, Search, Sparkles, Users, Video } from "lucide-react";
import BeadMark from "@/components/brand/bead-mark";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await createClient();
  const [{ data: { user } }, { data: posts }, { data: stories }, { data: events }] = await Promise.all([
    db.auth.getUser(),
    db.from("circle_posts").select("id,title,body,topic,created_at,author_id,media_url,media_type,hashtags").eq("is_hidden", false).order("created_at", { ascending: false }).limit(6),
    db.from("stories").select("id,title,slug,excerpt,category,published_at,author_id,cover_image_url,county").eq("status", "published").order("published_at", { ascending: false }).limit(4),
    db.from("literary_events").select("id,title,starts_at,county,event_type").gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }).limit(3)
  ]);
  const ids = [...new Set([...(posts ?? []).map(p => p.author_id), ...(stories ?? []).map(s => s.author_id)])];
  const { data: profiles } = ids.length ? await db.from("profiles").select("id,display_name,username,county,avatar_url").in("id", ids) : { data: [] };
  const people = new Map((profiles ?? []).map(p => [p.id, p]));
  const display = (id: string) => people.get(id)?.display_name || people.get(id)?.username || "Afrofemme writer";
  return <main className="af-home">
    <div className="af-topline"><span>✳ A DIGITAL HOME FOR AFRICAN WOMEN</span><span>HER VOICE. HER STORY. HER WORLD.</span></div>
    <header className="af-nav">
      <Link href="/" className="af-wordmark af-brand-lockup" aria-label="Afrofemme Writers home"><BeadMark variant="cluster" size={34} label="" /><span className="af-brand-word">afrofemme<span className="af-brand-dot">.</span></span></Link>
      <nav><Link className="active" href="/">Home</Link><Link href="/feed">Community</Link><Link href="/discover">Discover</Link><Link href="/stories">Read</Link><Link href="/gatherings">Gatherings</Link></nav>
      <div className="af-nav-actions"><Link aria-label="Search writers" href="/discover"><Search size={18}/></Link><Link aria-label="Notifications" href="/notifications"><Bell size={18}/></Link>{user ? <Link className="af-avatar-link" href="/profile">↗</Link> : <Link className="af-login" href="/login">Log in</Link>}<Link className="af-join" href={user ? "/dashboard" : "/signup"}>{user ? "My studio" : "Join Afrofemme"} <ArrowUpRight size={15}/></Link></div>
    </header>
    <section className="af-hero">
      <div className="af-hero-copy"><div className="af-eyebrow"><Sparkles size={14}/> THE STORIES WE TELL CHANGE EVERYTHING</div><h1>A world shaped<br/>by <em>her words.</em></h1><p>A living network for African women to create, connect, publish and be seen. Not just a place to post your work — a place to find your people.</p><div className="af-hero-actions"><Link href="/feed" className="af-primary">Enter the community <ArrowUpRight size={16}/></Link><Link href="/discover" className="af-secondary">Meet the voices</Link></div><div className="af-hero-foot"><span>✳  WRITERS · READERS · MAKERS</span><span>ROOTED IN AFRICA. CONNECTED EVERYWHERE.</span></div></div>
      <div className="af-hero-visual"><div className="af-hero-image"/><div className="af-image-note"><span>01 / THE AFROFEMME MOVEMENT</span><strong>We are the<br/><i>storytellers.</i></strong></div><div className="af-orbit">✳ HER WORLD · HER WORDS · HER VOICE · </div></div>
    </section>
    <section className="af-shortcuts"><Link href="/feed"><span><HomeIcon size={18}/></span><b>The feed</b><small>What's happening</small></Link><Link href="/discover"><span><Compass size={18}/></span><b>Explore</b><small>Find your people</small></Link><Link href="/community"><span><Users size={18}/></span><b>Circles</b><small>Grow together</small></Link><Link href="/inbox"><span><MessageCircle size={18}/></span><b>Messenger</b><small>Stay connected</small></Link><Link href="/voices"><span><Mic2 size={18}/></span><b>Voices</b><small>Listen & be heard</small></Link><Link href="/dashboard"><span><Feather size={18}/></span><b>Studio</b><small>Create your work</small></Link></section>
    <section className="af-content">
      <div className="af-main-column">
        <div className="af-section-title"><div><span className="af-eyebrow">THE SOCIAL EDIT</span><h2>Inside our world<span>.</span></h2></div><Link href="/feed">See all updates <ArrowUpRight size={14}/></Link></div>
        <div className="af-moments"><div className="af-moment af-moment-own"><Link href={user ? "/community" : "/signup"}><span>＋</span><b>Your moment</b><small>Share something</small></Link></div><Link className="af-moment af-moment-one" href="/voices"><b>Spoken word</b><small>Hear her voice ↗</small></Link><Link className="af-moment af-moment-two" href="/challenges"><b>Daily Ink</b><small>Write today ↗</small></Link><Link className="af-moment af-moment-three" href="/gatherings"><b>In real life</b><small>Meet & connect ↗</small></Link></div>
        {!posts?.length ? <div className="af-empty"><ImagePlus size={22}/><b>The first post is waiting for you.</b><p>Start a conversation and bring the community to life.</p><Link href={user ? "/community" : "/signup"}>Share your first post ↗</Link></div> : <div className="af-post-list">{posts.slice(0,4).map((post:any) => { const person=people.get(post.author_id); return <article className="af-post" key={post.id}><div className="af-post-head"><span className="af-post-avatar">{person?.avatar_url ? <img src={person.avatar_url} alt=""/> : (display(post.author_id).slice(0,1).toUpperCase())}</span><div><b>{display(post.author_id)}</b><small>{person?.county || "Across Africa"} · {new Date(post.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short"})}</small></div><span className="af-post-topic">{post.topic || "COMMUNITY"}</span></div><h3>{post.title}</h3><p>{post.body?.length>260 ? post.body.slice(0,260)+"…" : post.body}</p>{post.media_url && <div className="af-post-media">{post.media_type==="video" ? <video src={post.media_url} controls playsInline/> : <img src={post.media_url} alt="Community post"/>}</div>}<div className="af-post-actions"><span><Heart size={15}/> Celebrate</span><span><MessageCircle size={15}/> Join conversation</span><Link href="/community">Open post ↗</Link></div></article>})}</div>}
        <div className="af-section-title af-stories-title"><div><span className="af-eyebrow">FRESH FROM THE PAGE</span><h2>Words worth <em>keeping.</em></h2></div><Link href="/stories">The reading room <ArrowUpRight size={14}/></Link></div>
        <div className="af-story-grid">{stories?.length ? stories.slice(0,3).map((story:any,i:number)=><Link href={"/stories/"+story.slug} className={"af-story af-story-"+i} key={story.id}><div className="af-story-image" style={story.cover_image_url?{backgroundImage:"url("+story.cover_image_url+")"}:undefined}/><span>{story.category || "COMMUNITY STORY"}</span><h3>{story.title}</h3><small>BY {display(story.author_id).toUpperCase()}</small></Link>) : <div className="af-empty"><BookOpen size={22}/><b>New stories are on their way.</b><p>Discover the writers shaping our next chapter.</p><Link href="/discover">Meet the writers ↗</Link></div>}</div>
      </div>
      <aside className="af-side-column">
        <div className="af-side-card af-manifesto"><span className="af-eyebrow">OUR MANIFESTO</span><div>We are not<br/>waiting to be<br/><em>discovered.</em></div><p>We are building the room, writing the pages and deciding what the future sounds like.</p><Link href="/about">What we believe ↗</Link></div>
        <div className="af-side-card af-events"><div className="af-side-heading"><span className="af-eyebrow">ON THE CALENDAR</span><Link href="/gatherings">All events ↗</Link></div><h3>Meet beyond<br/>the screen.</h3>{events?.length ? events.map((event:any)=><Link className="af-event" href="/gatherings" key={event.id}><span>{new Date(event.starts_at).toLocaleDateString("en-KE",{day:"2-digit",month:"short"})}</span><div><b>{event.title}</b><small>{event.county || "Online"} · {event.event_type || "Gathering"}</small></div><ArrowUpRight size={14}/></Link>) : <p className="af-muted">Workshops, readings and gatherings will appear here.</p>}</div>
        <div className="af-side-card af-challenge"><span className="af-eyebrow">A LITTLE CREATIVE NUDGE</span><span className="af-challenge-mark">✳</span><h3>Make something<br/><em>today.</em></h3><p>One prompt. One page. One brave beginning.</p><Link href="/challenges">Enter the Ink Room <ArrowUpRight size={14}/></Link></div>
        <div className="af-side-card af-join-card"><span>YOUR VOICE BELONGS HERE.</span><h3>Pull up<br/>a chair.</h3><Link href={user?"/dashboard":"/signup"}>{user?"Open your studio":"Create your account"} ↗</Link></div>
      </aside>
    </section>
    <footer className="af-footer"><Link href="/" className="af-wordmark">afrofemme<span>.</span></Link><span>HER VOICE. HER STORY. HER WORLD.</span><div><Link href="/privacy">Privacy</Link><Link href="/community-guidelines">Community guidelines</Link><Link href="mailto:afrofemmewritingclub@gmail.com">Contact</Link></div><small>© {new Date().getFullYear()} AFROFEMME</small></footer>
    <nav className="af-mobile-dock"><Link href="/"><HomeIcon size={19}/><small>Home</small></Link><Link href="/discover"><Compass size={19}/><small>Explore</small></Link><Link href="/community"><span className="af-dock-plus">＋</span><small>Create</small></Link><Link href="/inbox"><MessageCircle size={19}/><small>Inbox</small></Link><Link href="/profile"><Users size={19}/><small>You</small></Link></nav>
  </main>;
}
