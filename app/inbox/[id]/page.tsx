import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import InboxThread from "../inbox-thread";
export const dynamic="force-dynamic";
export default async function ConversationPage({params}:{params:Promise<{id:string}>}){
 const {id}=await params;const db=await createClient();const {data:{user}}=await db.auth.getUser();if(!user)redirect("/login?next=/inbox/"+id);
 const {data:conversation}=await db.from("conversations").select("id,participant_one,participant_two,created_by,created_at").eq("id",id).maybeSingle();if(!conversation)notFound();
 const {data:members}=await db.from("conversation_members").select("conversation_id,user_id,accepted_at,last_read_at").eq("conversation_id",id);
 const own=members?.find(m=>m.user_id===user.id);const other=members?.find(m=>m.user_id!==user.id);if(!own||!other)notFound();
 const otherId=other.user_id;const {data:profile}=await db.from("profiles").select("display_name,username,avatar_url").eq("id",otherId).maybeSingle();
 const {data:messages}=await db.from("messages").select("id,conversation_id,sender_id,body,created_at").eq("conversation_id",id).order("created_at",{ascending:true}).limit(200);
 const accepted=Boolean(own.accepted_at&&other.accepted_at);
 return <main className="feature-page inbox-thread-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/inbox">← Back to inbox</Link><Link href="/community">Sisters’ Circle</Link></nav></header><section className="feature-intro inbox-thread-intro"><span className="eyebrow accent">PRIVATE CONVERSATION</span><h1>{profile?.display_name||profile?.username||"Community writer"}</h1><p>Messages are private to the two members in this conversation.</p></section><InboxThread conversationId={id} viewerId={user.id} otherName={profile?.display_name||profile?.username||"Community writer"} accepted={accepted} isRequester={conversation.created_by===user.id} initialMessages={messages??[]} /></main>;
}
