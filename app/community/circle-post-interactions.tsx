"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
type Reply={id:string;body:string;created_at:string;author_id:string;author_name:string};
type Props={postId:string;initialReplies:Reply[];initialCounts:{heart:number;celebrate:number;insightful:number};viewerReaction:string|null};
export default function CirclePostInteractions({postId,initialReplies,initialCounts,viewerReaction}:Props){
 const [replies,setReplies]=useState(initialReplies),[counts,setCounts]=useState(initialCounts),[mine,setMine]=useState(viewerReaction),[draft,setDraft]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 async function react(kind:"heart"|"celebrate"|"insightful"){
  const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setMessage("Please sign in to react.");return;}
  const previous=mine;
  if(previous===kind){const {error}=await db.from("circle_reactions").delete().eq("post_id",postId).eq("user_id",user.id);if(error){setMessage(error.message);return;}setMine(null);setCounts(c=>({...c,[kind]:Math.max(0,c[kind]-1)}));}
  else {if(previous){const {error}=await db.from("circle_reactions").delete().eq("post_id",postId).eq("user_id",user.id);if(error){setMessage(error.message);return;}}
   const {error}=await db.from("circle_reactions").insert({post_id:postId,user_id:user.id,reaction:kind});if(error){setMessage(error.message);return;}
   setCounts(c=>({...c,[kind]:c[kind]+1,...(previous?{[previous]:Math.max(0,c[previous as keyof typeof c]-1)}:{})}));setMine(kind);
  }
 }
 async function reply(e:React.FormEvent){e.preventDefault();const body=draft.trim();if(!body)return;setBusy(true);setMessage("");try{const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error("Please sign in again.");const {data,error}=await db.from("circle_replies").insert({post_id:postId,author_id:user.id,body}).select("id,body,created_at,author_id").single();if(error)throw error;setReplies(rows=>[...rows,{...data,author_name:user.user_metadata?.display_name||"You"}]);setDraft("");setMessage("Your reply has been added.");}catch(err){setMessage(err instanceof Error?err.message:"Could not add your reply.");}finally{setBusy(false);}}
 return <div className="circle-interactions"><div className="circle-reaction-row">{([{id:"heart",label:"Love",emoji:"♡"},{id:"celebrate",label:"Celebrate",emoji:"✦"},{id:"insightful",label:"Thoughtful",emoji:"✧"}] as const).map(r=><button key={r.id} type="button" aria-pressed={mine===r.id} className={mine===r.id?"reaction active":"reaction"} onClick={()=>react(r.id)}>{r.emoji} {r.label} <span>{counts[r.id]}</span></button>)}</div>
 {replies.length>0&&<div className="circle-replies">{replies.map(r=><div className="circle-reply" key={r.id}><strong>{r.author_name}</strong><p>{r.body}</p><small>{new Date(r.created_at).toLocaleDateString("en-KE",{day:"numeric",month:"short"})}</small></div>)}</div>}
 <form className="circle-reply-form" onSubmit={reply}><input aria-label="Write a reply" maxLength={3000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Add a thoughtful reply…"/><button disabled={busy||!draft.trim()}>{busy?"Sending…":"Reply"}</button></form>{message&&<p className="circle-feedback" role="status">{message}</p>}</div>;
}
