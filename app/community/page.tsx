import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import CircleComposer from "./circle-composer";
import CirclePostInteractions from "./circle-post-interactions";
export const metadata={title:"Sisters’ Circle"};
export default async function CommunityPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/community");
 const {data:posts,error}=await db.from("circle_posts").select("id,title,body,topic,created_at,author_id").eq("is_hidden",false).order("created_at",{ascending:false}).limit(50);
 const ids=(posts??[]).map(p=>p.id),authorIds=[...new Set((posts??[]).map(p=>p.author_id))];
 const [{data:authors},{data:replyRows},{data:reactionRows}]=await Promise.all([
  authorIds.length?db.from("profiles").select("id,display_name,username,county").in("id",authorIds):Promise.resolve({data:[]}),
  ids.length?db.from("circle_replies").select("id,post_id,author_id,body,created_at").in("post_id",ids).order("created_at"):Promise.resolve({data:[]}),
  ids.length?db.from("circle_reactions").select("post_id,user_id,reaction").in("post_id",ids):Promise.resolve({data:[]})
 ]);
 const replyAuthorIds=[...new Set((replyRows??[]).map(r=>r.author_id))];
 const {data:replyAuthors}=replyAuthorIds.length?await db.from("profiles").select("id,display_name").in("id",replyAuthorIds):{data:[]};
 const authorMap=new Map((authors??[]).map(a=>[a.id,a])),replyAuthorMap=new Map((replyAuthors??[]).map(a=>[a.id,a.display_name]));
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/feed">Community feed</Link><Link href="/challenges">Writing challenge</Link><Link href="/prompts">Ink Room</Link><Link href="/dashboard">Writer’s desk</Link></nav></header>
 <section className="feature-intro"><span className="eyebrow accent">THE COMMUNITY · SISTERS’ CIRCLE</span><h1>Good words grow<br/><em>in good company.</em></h1><p>A thoughtful space to ask questions, share progress, exchange ideas and support the women writing beside you.</p><div className="engagement-quicklinks"><Link href="/feed">Explore the community feed ↗</Link><Link href="/challenges">Join this week’s challenge ↗</Link></div></section>
 <CircleComposer/><section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">THE CONVERSATION</span><h2>From the circle</h2></div><span>{posts?.length??0} conversations</span></div>
 {error?<p className="feature-empty">The Circle is temporarily unavailable. Please try again shortly.</p>:!posts?.length?<p className="feature-empty">The circle is quiet for now. Start the first conversation.</p>:posts.map(p=>{const reactions=(reactionRows??[]).filter(r=>r.post_id===p.id),postReplies=(replyRows??[]).filter(r=>r.post_id===p.id);const counts={heart:reactions.filter(r=>r.reaction==="heart").length,celebrate:reactions.filter(r=>r.reaction==="celebrate").length,insightful:reactions.filter(r=>r.reaction==="insightful").length};return <article className="feature-card circle-post-card" key={p.id}><div className="feature-card-meta"><span>{p.topic}</span><span>{new Date(p.created_at).toLocaleDateString("en-KE")}</span></div><h3>{p.title}</h3><p>{p.body}</p><small>{authorMap.get(p.author_id)?.display_name||"A community writer"}{authorMap.get(p.author_id)?.county?" · "+authorMap.get(p.author_id)?.county:""}</small><CirclePostInteractions postId={p.id} initialCounts={counts} viewerReaction={reactions.find(r=>r.user_id===user.id)?.reaction??null} initialReplies={postReplies.map(r=>({id:r.id,body:r.body,created_at:r.created_at,author_id:r.author_id,author_name:replyAuthorMap.get(r.author_id)||"Community writer"}))}/></article>})}</section></main>;
}
