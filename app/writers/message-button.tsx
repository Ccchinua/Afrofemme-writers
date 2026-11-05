"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";
export default function MessageButton({writerId,writerName}:{writerId:string;writerName:string}){
 const [open,setOpen]=useState(false),[body,setBody]=useState(""),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");const router=useRouter();
 async function submit(e:React.FormEvent){e.preventDefault();const text=body.trim();if(!text)return;setBusy(true);setNotice("");try{
  const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error("Please sign in to message a writer.");if(user.id===writerId)throw new Error("You cannot message yourself.");
  const [one,two]=[user.id,writerId].sort();let conversationId:string;
  const {data:existing,error:lookupError}=await db.from("conversations").select("id,created_by").eq("participant_one",one).eq("participant_two",two).maybeSingle();if(lookupError)throw lookupError;
  if(existing){
   conversationId=existing.id;
   const {data:members,error:membersError}=await db.from("conversation_members").select("user_id,accepted_at").eq("conversation_id",conversationId);if(membersError)throw membersError;
   const own=members?.find(m=>m.user_id===user.id),other=members?.find(m=>m.user_id===writerId);
   if(!own||!other)throw new Error("This conversation is unavailable.");
   if(!own.accepted_at&&existing.created_by!==user.id){const {error}=await db.from("conversation_members").update({accepted_at:new Date().toISOString()}).eq("conversation_id",conversationId).eq("user_id",user.id);if(error)throw error;}
   else if(!other.accepted_at){setNotice("Your earlier message request is still waiting for acceptance.");router.push("/inbox/"+conversationId);return;}
  }else{
   const {data:created,error}=await db.from("conversations").insert({participant_one:one,participant_two:two,created_by:user.id}).select("id").single();if(error)throw error;conversationId=created.id;
  }
  const {error:sendError}=await db.from("messages").insert({conversation_id:conversationId,sender_id:user.id,body:text});if(sendError)throw sendError;
  setBody("");setOpen(false);router.push("/inbox/"+conversationId);router.refresh();
 }catch(e){setNotice(e instanceof Error?e.message:"Unable to send your message.");}finally{setBusy(false);}}
 return <div className="profile-message-action"><button type="button" className="button-dark" onClick={()=>setOpen(v=>!v)}>{open?"Close message":"Message writer"}</button>{open&&<form className="profile-message-form" onSubmit={submit}><label>Private message to {writerName}<textarea rows={4} maxLength={4000} value={body} onChange={e=>setBody(e.target.value)} placeholder="Introduce yourself or share a thoughtful note…"/></label><small>New conversations begin as message requests.</small><button disabled={busy||!body.trim()}>{busy?"Sending…":"Send private message"}</button></form>}{notice&&<p role="status" className="circle-feedback">{notice}</p>}</div>;
}
