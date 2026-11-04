import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const metadata={title:"My Writing Journey"};
export default async function JourneyPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/journey");
 const [stories,prompts,challenges,posts,following,followers,awards]=await Promise.all([
  db.from("stories").select("id",{count:"exact",head:true}).eq("author_id",user.id),
  db.from("prompt_entries").select("id",{count:"exact",head:true}).eq("author_id",user.id),
  db.from("challenge_entries").select("id",{count:"exact",head:true}).eq("author_id",user.id),
  db.from("circle_posts").select("id",{count:"exact",head:true}).eq("author_id",user.id),
  db.from("follows").select("followed_id",{count:"exact",head:true}).eq("follower_id",user.id),
  db.from("follows").select("follower_id",{count:"exact",head:true}).eq("followed_id",user.id),
  db.from("user_achievements").select("achievement_id,awarded_at").eq("user_id",user.id).order("awarded_at",{ascending:false})
 ]);
 const total=(stories.count||0)+(prompts.count||0)+(challenges.count||0)+(posts.count||0);
 const definitions=await db.from("achievement_definitions").select("id,title,description,icon");
 const defs=new Map((definitions.data??[]).map(d=>[d.id,d]));
 const stats=[{label:"Stories created",value:stories.count||0,href:"/dashboard"},{label:"Prompt responses",value:prompts.count||0,href:"/prompts"},{label:"Challenge entries",value:challenges.count||0,href:"/challenges"},{label:"Circle conversations",value:posts.count||0,href:"/community"},{label:"Writers followed",value:following.count||0,href:"/writers"},{label:"Following you",value:followers.count||0,href:"/writers"}];
 const next=total<1?"Publish your first piece":total<5?"Keep your words moving":total<10?"You’re building a writing habit":"Your voice is becoming part of the archive";
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/feed">Community feed</Link><Link href="/dashboard">Writer’s Desk</Link><Link href="/profile">Edit profile</Link></nav></header><section className="feature-intro"><span className="eyebrow accent">YOUR MEMBER SPACE</span><h1>Your words.<br/><em>Your becoming.</em></h1><p>A personal record of what you have made, who you have found and how your writing life is growing.</p></section><section className="journey-hero"><span className="eyebrow">YOUR NEXT CHAPTER</span><h2>{next}</h2><p>Every published story, generous conversation and creative experiment adds to your journey.</p><div className="journey-actions"><Link className="button-dark" href="/dashboard">Open Writer’s Desk ↗</Link><Link className="button-outline" href="/challenges">Try this week’s challenge</Link></div></section><section className="journey-stats">{stats.map(s=><Link className="journey-stat" href={s.href} key={s.label}><strong>{s.value}</strong><span>{s.label}</span></Link>)}</section><section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">MILESTONES</span><h2>Your achievements</h2></div><span>{awards.data?.length||0} earned</span></div>{!awards.data?.length?<p className="feature-empty">Your first milestone is waiting. Publish a story, answer a prompt or start a conversation to begin.</p>:<div className="achievement-grid">{awards.data.map(a=>{const d=defs.get(a.achievement_id);return <article className="achievement-card" key={a.achievement_id}><span>{d?.icon||"✦"}</span><h3>{d?.title||a.achievement_id.replaceAll("_"," ")}</h3><p>{d?.description||"A milestone in your writing journey."}</p><small>Earned {new Date(a.awarded_at).toLocaleDateString("en-KE")}</small></article>})}</div>}</section><section className="journey-next"><h2>Keep finding your people.</h2><div className="engagement-quicklinks"><Link href="/writers">Discover writers ↗</Link><Link href="/voices">Listen to the voices ↗</Link><Link href="/gatherings">Meet in person ↗</Link></div></section></main>;
}
