"use client";

import {useEffect,useRef,useState} from "react";
import {createClient} from "@/lib/supabase/client";

export default function ReadingProgress({storyId}:{storyId:string}){
 const [progress,setProgress]=useState(0);
 const [signedIn,setSignedIn]=useState(false);
 const lastSaved=useRef(0);

 useEffect(()=>{
  const db=createClient();
  let active=true;
  let userId:string|null=null;
  let frame=0;
  let saveTimer:ReturnType<typeof setTimeout>|null=null;

  const save=(value:number)=>{
   if(!userId)return;
   if(value<lastSaved.current+5&&value!==100)return;
   lastSaved.current=Math.max(lastSaved.current,value);
   if(saveTimer)clearTimeout(saveTimer);
   saveTimer=setTimeout(async()=>{
    const {error}=await db.from("reading_history").upsert({
     user_id:userId,
     story_id:storyId,
     progress_percent:value,
     last_read_at:new Date().toISOString()
    },{onConflict:"user_id,story_id"});
    if(error)lastSaved.current=Math.max(0,lastSaved.current-5);
   },650);
  };

  const measure=()=>{
   if(frame)window.cancelAnimationFrame(frame);
   frame=window.requestAnimationFrame(()=>{
    const body=document.querySelector<HTMLElement>(".article-body");
    if(!body)return;
    const top=body.getBoundingClientRect().top+window.scrollY;
    const height=Math.max(1,body.scrollHeight);
    const value=Math.max(0,Math.min(100,Math.round(((window.scrollY+window.innerHeight-top)/height)*100)));
    setProgress(value);
    save(value);
   });
  };

  const initialize=async()=>{
   const {data:{user}}=await db.auth.getUser();
   if(!active)return;
   if(user){
    userId=user.id;
    setSignedIn(true);
    const {data}=await db.from("reading_history").select("progress_percent").eq("user_id",user.id).eq("story_id",storyId).maybeSingle();
    if(!active)return;
    const previous=data?.progress_percent??0;
    lastSaved.current=previous;
    setProgress(previous);
    await db.from("reading_history").upsert({
     user_id:user.id,
     story_id:storyId,
     progress_percent:previous,
     last_read_at:new Date().toISOString()
    },{onConflict:"user_id,story_id"});
   }
   measure();
  };

  void initialize();
  window.addEventListener("scroll",measure,{passive:true});
  window.addEventListener("resize",measure);
  return ()=>{
   active=false;
   window.removeEventListener("scroll",measure);
   window.removeEventListener("resize",measure);
   if(frame)window.cancelAnimationFrame(frame);
   if(saveTimer)clearTimeout(saveTimer);
  };
 },[storyId]);

 return <section style={{margin:"1.5rem 0",padding:"1rem 1.15rem",border:"1px solid #e7ded5",borderRadius:"14px",background:"#fbf8f4"}}>
  <div style={{display:"flex",justifyContent:"space-between",gap:"1rem",alignItems:"center",marginBottom:".65rem"}}>
   <span style={{fontSize:".78rem",letterSpacing:".08em",textTransform:"uppercase",color:"#6c5148"}}>Reading progress</span>
   <strong style={{fontSize:".9rem",color:"#252b52"}}>{progress}%</strong>
  </div>
  <div role="progressbar" aria-label="Story reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress} style={{height:"7px",borderRadius:"99px",background:"#e8dfd7",overflow:"hidden"}}>
   <span style={{display:"block",height:"100%",width:progress+"%",background:"#b85e48",transition:"width .2s ease"}}/>
  </div>
  {!signedIn&&<small style={{display:"block",marginTop:".65rem",color:"#75675f"}}>Sign in to save your reading progress across devices.</small>}
 </section>;
}
