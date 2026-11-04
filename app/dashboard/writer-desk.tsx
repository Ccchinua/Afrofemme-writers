"use client";
import {useState} from "react";
import Link from "next/link";
import {createClient} from "@/lib/supabase/client";
import {ArrowLeft,BookOpen,FileText,PenLine,Save,Send,Sparkles} from "lucide-react";
type Story={id:string;title:string;category:string;status:string;updated_at:string};
export default function WriterDesk({displayName,email,initialStories}:{displayName:string;email:string;initialStories:Story[]}){
 const [stories,setStories]=useState(initialStories),[title,setTitle]=useState(""),[category,setCategory]=useState("Essay"),[excerpt,setExcerpt]=useState(""),[body,setBody]=useState(""),[busy,setBusy]=useState(false),[message,setMessage]=useState("");
 const supabase=createClient();
 async function save(publish:boolean){
  if(!title.trim()||!body.trim()){setMessage("Add a title and some writing before saving.");return}
  setBusy(true);setMessage("");
  const {data:{user}}=await supabase.auth.getUser();
  if(!user){setMessage("Session expired. Please sign in again.");setBusy(false);return}
  const slug=title.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,55)+"-"+Date.now().toString(36);
  const {data,error}=await supabase.from("stories").insert({author_id:user.id,title:title.trim(),slug,excerpt:excerpt.trim(),body:{type:"plain_text",content:body},category,status:publish?"published":"draft",published_at:publish?new Date().toISOString():null}).select("id,title,category,status,updated_at").single();
  if(error){setMessage("Save failed: "+error.message);setBusy(false);return}
  setStories(s=>[data,...s]);setTitle("");setExcerpt("");setBody("");setCategory("Essay");setMessage(publish?"Your story is now published.":"Your draft has been saved.");setBusy(false);
 }
 return <main className="desk-page"><header className="desk-header"><Link href="/" className="desk-brand"><span>afrofemme writers</span><small>HER VOICE. HER STORY. HER WORLD.</small></Link><div className="desk-user"><span>{email}</span><Link href="/"><ArrowLeft size={16}/> Home</Link></div></header>
 <div className="desk-layout"><aside className="desk-sidebar"><div className="desk-greeting"><span className="eyebrow">YOUR WRITING SPACE</span><h1>Hello,<br/><em>{displayName}.</em></h1><p>A quiet place for your next beginning.</p></div><nav className="desk-nav"><a className="active" href="#compose"><PenLine size={17}/> Write a story</a><a href="#your-stories"><BookOpen size={17}/> Your stories <span>{stories.length}</span></a><a href="#guidance"><Sparkles size={17}/> Writing notes</a></nav><div className="desk-sidebar-note"><span>✳</span><p>Your words do not need permission to matter. Start where you are.</p></div></aside>
 <section className="desk-main"><div className="desk-welcome"><div><span className="eyebrow accent">THE WRITER'S DESK</span><h2>Make something<br/><i>only you can write.</i></h2></div><div className="desk-date">A space to draft, revise<br/>and share your voice.</div></div>
 <section className="compose-card" id="compose"><div className="compose-top"><div><span className="eyebrow accent">NEW WORK</span><h3>Begin a new story</h3></div><span className="draft-label"><FileText size={14}/> PRIVATE UNTIL PUBLISHED</span></div>
 <label className="desk-label">Story title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Give your story a name..." maxLength={160}/></label>
 <div className="desk-fields"><label className="desk-label">Form<select value={category} onChange={e=>setCategory(e.target.value)}><option>Essay</option><option>Poetry</option><option>Fiction</option><option>Memoir</option><option>Review</option><option>Reflection</option></select></label><label className="desk-label">A short introduction<input value={excerpt} onChange={e=>setExcerpt(e.target.value)} placeholder="What is this piece about?" maxLength={280}/></label></div>
 <label className="desk-label">Your words<textarea className="desk-editor" rows={12} value={body} onChange={e=>setBody(e.target.value)} placeholder={"Start writing here...\n\nTake your time. This is your space."}/></label>
 <div className="desk-compose-bottom"><span>{body.trim()?body.trim().split(/\s+/).length:0} words</span><div><button className="desk-save" disabled={busy} onClick={()=>save(false)}><Save size={16}/>{busy?"Saving...":"Save draft"}</button><button className="desk-publish" disabled={busy} onClick={()=>save(true)}><Send size={16}/>Publish story</button></div></div>{message&&<p className="desk-message" role="status">{message}</p>}</section>
 <section className="your-stories" id="your-stories"><div className="compose-top"><div><span className="eyebrow accent">YOUR LIBRARY</span><h3>Stories on your desk</h3></div><span className="story-count">{stories.length} pieces</span></div>
 {stories.length===0?<div className="desk-empty"><BookOpen size={26}/><p>Your writing shelf is waiting.</p><span>Your saved drafts and published stories will appear here.</span></div>:<div className="desk-story-list">{stories.map(s=><article className="desk-story-row" key={s.id}><div><span className="eyebrow accent">{s.category} · {s.status}</span><h4>{s.title}</h4><small>Updated {new Date(s.updated_at).toLocaleDateString()}</small></div><span className="desk-story-status">{s.status}</span></article>)}</div>}</section>
 <section className="desk-guidance" id="guidance"><Sparkles size={19}/><div><h3>A small note to the writer</h3><p>Save a draft privately and return later. Publishing makes it visible in the public reading space. Write honestly; edit gently.</p></div></section></section></div></main>;
}