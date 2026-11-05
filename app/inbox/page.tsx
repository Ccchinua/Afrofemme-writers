import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
export const dynamic="force-dynamic";
export const metadata={title:"Afrofemme Inbox"};
export default async function InboxPage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/inbox");
 const {data:conversations,error}=await db.from("conversations").select("id,participant_one,participant_two,created_by,created_at").or("participant_one.eq."+user.id+",participant_two.eq."+user.id).order("created_at",{ascending:false}).limit(100);
 const ids=(conversations??[]).map(c=>c.id);
 const [{data:members},{data:messages}]=await Promise.all([
  ids.length?db.from("conversation_members").select("conversation_id,user_id,accepted_at,last_read_at").in("conversation_id",ids):Promise.resolve({data:[]}),
  ids.length?db.from("messages").select("id,conversation_id,sender_id,body,created_at").in("conversation_id",ids).order("created_at",{ascending:false}).limit(200):Promise.resolve({data:[]})
 ]);
 const otherIds=[...new Set((conversations??[]).map(c=>c.participant_one===user.id?c.participant_two:c.participant_one))];
 const {data:profiles}=otherIds.length?await db.from("profiles").select("id,display_name,username,avatar_url").in("id",otherIds):{data:[]};
 const profileMap=new Map((profiles??[]).map(p=>[p.id,p]));
 const sorted=(conversations??[]).map(c=>{
  const own=(members??[]).find(m=>m.conversation_id===c.id&&m.user_id===user.id);
  const other=(members??[]).find(m=>m.conversation_id===c.id&&m.user_id!===user.id);
  const otherId=c.participant_one===user.id?c.participant_two:c.participant_one;
  const last=(messages??[]).find(m=>m.conversation_id===c.id);
  const accepted=Boolean(own?.accepted_at&&other?.accepted_at);
  const incoming=!accepted&&c.created_by!==user.id;
  const unread=accepted&&(messages??[]).some(m=>m.conversation_id===c.id&&m.sender_id!==user.id&&(!own?.last_read_at||new Date(m.created_at)>new Date(own.last_read_at)));
  return {...c,otherId,profile:profileMap.get(otherId),last,accepted,incoming,unread};
 });
 return <main className="feature-page inbox-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/member">My home</Link><Link href="/community">Sisters’ Circle</Link><Link href="/notifications">Activity</Link><Link href="/writers">Discover writers</Link></nav></header><section className="feature-intro"><span className="eyebrow accent">PRIVATE MEMBER SPACE</span><h1>Conversations<br/><em>between writers.</em></h1><p>Your private space to connect, encourage one another and collaborate. New conversations arrive as message requests.</p></section><section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">YOUR INBOX</span><h2>Messages and requests</h2></div><span>{sorted.filter(x=>x.incoming).length} requests</span></div>{error?<p className="feature-empty">Your inbox is temporarily unavailable.</p>:!sorted.length?<p className="feature-empty">Your inbox is waiting. Visit <Link href="/writers">Discover Writers</Link> and send someone a note.</p>:sorted.map(c=><Link href={"/inbox/"+c.id} className="inbox-row" key={c.id}><span className="inbox-avatar">{c.profile?.avatar_url?<img src={c.profile.avatar_url} alt=""/>:(c.profile?.display_name||"W").slice(0,1).toUpperCase()}</span><span className="inbox-row-copy"><strong>{c.profile?.display_name||c.profile?.username||"Afrofemme writer"}</strong><small>{c.incoming?"New message request · Accept to read":!c.accepted?"Request sent · Awaiting acceptance":c.last?.body||"Start the conversation"}</small></span><span className="inbox-row-meta">{c.incoming?<i className="inbox-request-dot"/>:c.unread?<i className="inbox-unread-dot"/>:null}<small>{new Date(c.last?.created_at||c.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short"})}</small></span></Link>)}</section><footer className="member-footer"><Link href="/privacy">Privacy</Link><Link href="/community-guidelines">Community guidelines</Link><Link href="/">Afrofemme Writers.</Link></footer></main>;
}
