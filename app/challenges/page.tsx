import Link from "next/link";
import {createClient} from "@/lib/supabase/server";
import ChallengeBoard from "./challenge-board";
export const metadata={title:"Writing Challenges"};
export default async function ChallengesPage(){
 const db=await createClient();const [{data:{user}},{data:challenge}]=await Promise.all([db.auth.getUser(),db.from("community_challenges").select("id,title,description,prompt,ends_at").eq("status","open").lte("starts_at",new Date().toISOString()).gt("ends_at",new Date().toISOString()).order("ends_at").limit(1).maybeSingle()]);
 const {data:entries}=challenge?await db.from("challenge_entries").select("id,title,body,created_at,author_id,visibility").eq("challenge_id",challenge.id).order("created_at",{ascending:false}).limit(60):{data:[]};
 const ids=[...new Set((entries??[]).map(e=>e.author_id))];const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,county").in("id",ids):{data:[]};const map=new Map((profiles??[]).map(p=>[p.id,p]));
 const shaped=(entries??[]).map(e=>({id:e.id,title:e.title,body:e.body,created_at:e.created_at,author_id:e.author_id,author_name:map.get(e.author_id)?.display_name||"A community writer",county:map.get(e.author_id)?.county||null,visibility:e.visibility}));
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/feed">Community feed</Link><Link href="/community">Sisters’ Circle</Link><Link href="/prompts">Ink Room</Link><Link href="/dashboard">Writer’s desk</Link></nav></header><section className="feature-intro"><span className="eyebrow accent">THE INK ROOM · CREATIVE PRACTICE</span><h1>One prompt.<br/><em>A thousand voices.</em></h1><p>Take a small creative risk, write alongside other women and discover what your words can become.</p></section><ChallengeBoard challenge={challenge??null} entries={shaped} userId={user?.id??null}/></main>;
}
