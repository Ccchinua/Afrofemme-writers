import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const metadata={title:"Community Feed"};
type FeedItem={id:string;kind:string;title:string;body:string;date:string;author_id:string;href:string};
export default async function FeedPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/feed");
 const [stories,posts,entries,audio,events]=await Promise.all([
  db.from("stories").select("id,title,excerpt,slug,published_at,author_id").eq("status","published").order("published_at",{ascending:false}).limit(12),
  db.from("circle_posts").select("id,title,body,created_at,author_id").eq("is_hidden",false).order("created_at",{ascending:false}).limit(12),
  db.from("prompt_entries").select("id,title,body,created_at,author_id,prompt_id").eq("visibility","community").order("created_at",{ascending:false}).limit(12),
  db.from("audio_readings").select("id,title,description,created_at,author_id").eq("is_published",true).order("created_at",{ascending:false}).limit(8),
  db.from("literary_events").select("id,title,description,starts_at,created_by").eq("is_published",true).gte("starts_at",new Date().toISOString()).order("starts_at").limit(6)
 ]);
 const items:FeedItem[]=[
  ...(stories.data??[]).map(x=>({id:"story-"+x.id,kind:"New story",title:x.title,body:x.excerpt||"A new story has been published.",date:x.published_at||new Date().toISOString(),author_id:x.author_id,href:"/stories/"+x.slug})),
  ...(posts.data??[]).map(x=>({id:"circle-"+x.id,kind:"Sisters’ Circle",title:x.title,body:x.body,date:x.created_at,author_id:x.author_id,href:"/community"})),
  ...(entries.data??[]).map(x=>({id:"entry-"+x.id,kind:"Ink Room entry",title:x.title,body:x.body,date:x.created_at,author_id:x.author_id,href:"/prompts"})),
  ...(audio.data??[]).map(x=>({id:"audio-"+x.id,kind:"Voice reading",title:x.title,body:x.description||"A writer has shared a new audio reading.",date:x.created_at,author_id:x.author_id,href:"/voices"})),
  ...(events.data??[]).map(x=>({id:"event-"+x.id,kind:"Upcoming event",title:x.title,body:x.description||"A literary gathering is coming up.",date:x.starts_at,author_id:x.created_by,href:"/events"}))
 ].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime()).slice(0,35);
 const ids=[...new Set(items.map(i=>i.author_id).filter(Boolean))];const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,county,avatar_url").in("id",ids):{data:[]};const map=new Map((profiles??[]).map(p=>[p.id,p]));
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/community">Sisters’ Circle</Link><Link href="/challenges">Challenges</Link><Link href="/dashboard">My writing</Link><Link href="/notifications">Inbox</Link></nav></header><section className="feature-intro"><span className="eyebrow accent">THE COMMUNITY · YOUR DAILY EDIT</span><h1>What’s happening<br/><em>in our world.</em></h1><p>Fresh stories, conversations, creative entries, voices and gatherings from across the Afrofemme community.</p><div className="engagement-quicklinks"><Link href="/community">Start a conversation ↗</Link><Link href="/challenges">Write this week’s challenge ↗</Link><Link href="/writers">Discover writers ↗</Link></div></section><section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">HAPPENING NOW</span><h2>Your community feed</h2></div><span>{items.length} updates</span></div>{!items.length?<p className="feature-empty">The feed is quiet today. Be the first to <Link href="/community">start a conversation</Link> or <Link href="/dashboard">publish a story</Link>.</p>:items.map(item=>{const author=map.get(item.author_id);return <article className="feature-card feed-card" key={item.id}><div className="feed-author-row">{author?.avatar_url?<img src={author.avatar_url} alt="" className="feed-avatar"/>:<span className="feed-avatar feed-initial">{(author?.display_name||"A").slice(0,1).toUpperCase()}</span>}<div><strong>{author?.display_name||"Afrofemme Writers"}</strong><small>{author?.county||"Kenya"} · {new Date(item.date).toLocaleString("en-KE",{dateStyle:"medium",timeStyle:"short"})}</small></div><span className="feed-kind">{item.kind}</span></div><h3>{item.title}</h3><p>{item.body.length>380?item.body.slice(0,380)+"…":item.body}</p><Link className="feature-link" href={item.href}>Explore ↗</Link></article>})}</section></main>;
}
