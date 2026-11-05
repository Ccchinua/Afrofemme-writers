"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {createClient} from "@/lib/supabase/client";

export default function CircleComposer(){
 const [body,setBody]=useState(""),[topic,setTopic]=useState("General"),[file,setFile]=useState<File|null>(null),[preview,setPreview]=useState<string|null>(null),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const router=useRouter();
 useEffect(()=>{if(!file){setPreview(null);return;}const url=URL.createObjectURL(file);setPreview(url);return()=>URL.revokeObjectURL(url);},[file]);
 async function submit(e:React.FormEvent){
  e.preventDefault();const caption=body.trim();if(!caption&&!file){setMessage("Write a caption or choose a photo/video.");return;}
  setBusy(true);setMessage("");
  try{
   const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user)throw new Error("Please sign in again.");
   let mediaUrl:string|null=null,mediaType:"image"|"video"|null=null;
   if(file){
    const allowed=["image/jpeg","image/png","image/webp","video/mp4","video/webm"];
    if(!allowed.includes(file.type))throw new Error("Choose a JPG, PNG, WebP, MP4 or WebM file.");
    if(file.size>20*1024*1024)throw new Error("Media must be 20 MB or smaller.");
    mediaType=file.type.startsWith("video/")?"video":"image";
    const extension=file.type.split("/")[1].replace("jpeg","jpg");
    const path=user.id+"/"+Date.now()+"-"+crypto.randomUUID()+"."+extension;
    const {error:uploadError}=await db.storage.from("social-media").upload(path,file,{contentType:file.type,upsert:false});
    if(uploadError)throw uploadError;
    mediaUrl=db.storage.from("social-media").getPublicUrl(path).data.publicUrl;
   }
   const title=caption.replace(/\s+/g," ").slice(0,100)||"A moment from the community";
   const hashtags=[...new Set((caption.match(/#[a-zA-Z0-9_]{2,32}/g)||[]).map(tag=>tag.slice(1).toLowerCase()))].slice(0,12);
   const {error}=await db.from("circle_posts").insert({author_id:user.id,title,body:caption||"Shared with the Afrofemme community.",topic,media_url:mediaUrl,media_type:mediaType,hashtags});
   if(error)throw error;
   setBody("");setFile(null);setMessage("Your post is live in the Circle.");router.refresh();
  }catch(err){setMessage(err instanceof Error?err.message:"Could not share your post.");}
  finally{setBusy(false);}
 }
 return <form className="feature-compose social-composer" onSubmit={submit}>
  <div className="social-compose-heading"><span className="eyebrow accent">YOUR COMMUNITY</span><h2>Share a moment.</h2><p>Post a thought, poem, photo or short video with the Afrofemme community.</p></div>
  <label>Space<select value={topic} onChange={e=>setTopic(e.target.value)}><option>General</option><option>Writing craft</option><option>Publishing</option><option>Reading recommendations</option><option>Encouragement</option><option>Kenyan literature</option><option>Poetry and spoken word</option></select></label>
  <label>Write a caption<textarea maxLength={8000} rows={4} value={body} onChange={e=>setBody(e.target.value)} placeholder="What is on your mind? Add #hashtags to help others discover your post…"/></label>
  {preview&&<div className="social-upload-preview">{file?.type.startsWith("video/")?<video src={preview} controls playsInline/>:<img src={preview} alt="Selected post preview"/>}<button type="button" onClick={()=>setFile(null)}>Remove media</button></div>}
  <div className="social-compose-actions"><label className="social-media-picker">＋ Add photo or video<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm" onChange={e=>setFile(e.target.files?.[0]??null)}/></label><small>Up to 20 MB · JPG, PNG, WebP, MP4 or WebM</small><button disabled={busy||(!body.trim()&&!file)}>{busy?"Sharing…":"Share post"}</button></div>
  {message&&<p role="status" className="circle-feedback">{message}</p>}
 </form>;
}
