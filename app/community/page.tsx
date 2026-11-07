import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import CircleComposer from "./circle-composer";
import CirclePostInteractions from "./circle-post-interactions";
export const metadata={title:"Sisters’ Circle"};
export default async function CommunityPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/community");
 const {data:blockedRows}=await db.rpc("get_blocked_member_ids");
 const blockedIds=new Set((blockedRows??[]).map((row:{member_id:string})=>row.member_id));
 const {data:allPosts,error}=await db.from("circle_posts").select("id,title,body,topic,created_at,author_id,media_url,media_type,hashtags").eq("is_hidden",false).order("created_at",{ascending:false}).limit(50);
 const posts=(allPosts??[]).filter(post=>!blockedIds.has(post.author_id));
 const ids=(posts??[]).map(p=>p.id),authorIds=[...new Set((posts??[]).map(p=>p.author_id))];
 const [{data:authors},{data:replyRows},{data:reactionRows},{data:repostRows}]=await Promise.all([
  authorIds.length?db.from("profiles").select("id,display_name,username,county,avatar_url").in("id",authorIds):Promise.resolve({data:[]}),
  ids.length?db.from("circle_replies").select("id,post_id,author_id,body,created_at").in("post_id",ids).order("created_at"):Promise.resolve({data:[]}),
  ids.length?db.from("circle_reactions").select("post_id,user_id,reaction").in("post_id",ids):Promise.resolve({data:[]}),
  ids.length?db.from("circle_reposts").select("post_id,user_id").in("post_id",ids):Promise.resolve({data:[]})
 ]);
 const replyAuthorIds=[...new Set((replyRows??[]).map(r=>r.author_id))];
 const {data:replyAuthors}=replyAuthorIds.length?await db.from("profiles").select("id,display_name").in("id",replyAuthorIds):{data:[]};
 const authorMap=new Map((authors??[]).map(a=>[a.id,a])),replyAuthorMap=new Map((replyAuthors??[]).map(a=>[a.id,a.display_name]));
 return <main className="feature-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/feed">Community feed</Link><Link href="/inbox">Inbox</Link><Link href="/notifications">Activity</Link><Link href="/writers">Discover writers</Link><Link href="/dashboard">Writer’s desk</Link></nav></header>
 <section className="feature-intro"><span className="eyebrow accent">THE COMMUNITY · SISTERS’ CIRCLE</span><h1>Good words grow<br/><em>in good company.</em></h1><p>A social home for sharing your words, moments, questions and creative progress with the women writing beside you.</p><div className="engagement-quicklinks"><Link href="/feed">Explore the community feed ↗</Link><Link href="/inbox">Send a private message ↗</Link><Link href="/writers">Find writers ↗</Link></div></section>
 <CircleComposer/><section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">THE CONVERSATION</span><h2>From the circle</h2></div><span>{posts?.length??0} posts</span></div>
 {error?<p className="feature-empty">The Circle is temporarily unavailable. Please try again shortly.</p>:!posts?.length?<p className="feature-empty">The circle is quiet for now. Share the first moment.</p>:posts.map(p=>{const reactions=(reactionRows??[]).filter(r=>r.post_id===p.id),postReplies=(replyRows??[]).filter(r=>r.post_id===p.id),postReposts=(repostRows??[]).filter(r=>r.post_id===p.id);const author=authorMap.get(p.author_id);const counts={heart:reactions.filter(r=>r.reaction==="heart").length,celebrate:reactions.filter(r=>r.reaction==="celebrate").length,insightful:reactions.filter(r=>r.reaction==="insightful").length};return <article className="feature-card circle-post-card social-post-card" key={p.id}>
  <div className="feed-author-row">{author?.avatar_url?<img src={author.avatar_url} alt="" className="feed-avatar"/>:<span className="feed-avatar feed-initial">{(author?.display_name||"A").slice(0,1).toUpperCase()}</span>}<div><strong>{author?.username?<Link href={"/writers/"+author.username}>{author.display_name||"Community writer"}</Link>:author?.display_name||"Community writer"}</strong><small>{author?.county||"Kenya"} · {new Date(p.created_at).toLocaleString("en-KE",{dateStyle:"medium",timeStyle:"short"})}</small></div><span className="feed-kind">{p.topic}</span></div>
  <h3>{p.title}</h3><p className="social-post-body">{p.body}</p>
  {p.media_url&&<div className="social-post-media">{p.media_type==="video"?<video src={p.media_url} controls playsInline preload="metadata"/>:<img src={p.media_url} alt={"Photo shared by "+(author?.display_name||"a community writer")}/>}</div>}
  {!!p.hashtags?.length&&<div className="social-hashtags">{p.hashtags.map((tag:string)=><Link key={tag} href={"/feed?tag="+encodeURIComponent(tag)}>#{tag}</Link>)}</div>}
  <CirclePostInteractions postId={p.id} initialCounts={counts} viewerReaction={reactions.find(r=>r.user_id===user.id)?.reaction??null} initialReplies={postReplies.map(r=>({id:r.id,body:r.body,created_at:r.created_at,author_id:r.author_id,author_name:replyAuthorMap.get(r.author_id)||"Community writer"}))} initialReposts={postReposts.length} viewerReposted={postReposts.some(r=>r.user_id===user.id)}/>
 </article>})}</section></main>;
}
