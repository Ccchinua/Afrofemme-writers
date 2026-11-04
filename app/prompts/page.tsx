import Link from "next/link";import {createClient} from "@/lib/supabase/server";
export const metadata={title:"The Ink Room"};
export default async function PromptsPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 const [{data:prompts,error},{data:dailyPrompts}]=await Promise.all([
  db.from("writing_prompts").select("id,title,prompt,category,starts_at,ends_at").eq("is_active",true).neq("category","Daily Ink").order("created_at",{ascending:false}).limit(40),
  db.from("writing_prompts").select("id,title,prompt").eq("is_active",true).eq("category","Daily Ink").order("created_at",{ascending:true}).order("id",{ascending:true}).limit(40)
 ]);
 const now=new Date(),dayNumber=Math.floor(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())/86400000),dailyPrompt=dailyPrompts?.length?dailyPrompts[((dayNumber%dailyPrompts.length)+dailyPrompts.length)%dailyPrompts.length]:null;
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/community">Sisters’ Circle</Link><Link href="/challenges">Weekly challenge</Link><Link href="/feed">Community feed</Link><Link href="/dashboard">Writer’s desk</Link></nav></header>
 <section className="feature-intro"><span className="eyebrow accent">THE INK ROOM · CREATIVE PRACTICE</span><h1>Begin with a<br/><em>little spark.</em></h1><p>Prompts to help you experiment, find a new angle and keep your writing moving.</p></section>
 {dailyPrompt&&<section className="daily-ink-card"><div className="eyebrow">TODAY’S DAILY INK · {now.toLocaleDateString("en-KE",{weekday:"long",day:"numeric",month:"long"})}</div><h2>{dailyPrompt.title}</h2><p>{dailyPrompt.prompt}</p>{user?<Link className="button-dark" href={"/prompts/"+dailyPrompt.id+"/respond"}>Write from this prompt ↗</Link>:<Link className="button-dark" href="/login?next=/prompts">Sign in to write ↗</Link>}</section>}
 <section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">WRITE SOMETHING TODAY</span><h2>Open prompts</h2></div><span>{prompts?.length??0} prompts</span></div>{error?<p className="feature-empty">Prompts are temporarily unavailable.</p>:!prompts?.length?<p className="feature-empty">New prompts are being prepared. Come back soon.</p>:prompts.map(p=><article className="feature-card" key={p.id}><div className="feature-card-meta"><span>{p.category}</span><span>✳ Writing invitation</span></div><h3>{p.title}</h3><p>{p.prompt}</p>{user?<Link className="feature-link" href={"/prompts/"+p.id+"/respond"}>Respond in your Writer’s Desk ↗</Link>:<Link className="feature-link" href="/login">Sign in to write ↗</Link>}</article>)}</section></main>;
}
