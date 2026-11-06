import Link from "next/link";
import type { Metadata } from "next";
import {notFound} from "next/navigation";
import {ArrowLeft,ArrowUpRight,Clock,MapPin} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import StoryCommunity from "./story-community";
export const dynamic="force-dynamic";
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{
 const {slug}=await params;const db=await createClient();
 const {data:story}=await db.from("stories").select("title,excerpt,cover_image_url").eq("slug",slug).eq("status","published").maybeSingle();
 if(!story)return {title:"Story | Afrofemme Writers"};
 const description=story.excerpt||"Read this story from the Afrofemme Writers community.";
 const images=story.cover_image_url?[{url:story.cover_image_url}]:[];
 return {title:story.title+" | Afrofemme Writers",description,openGraph:{title:story.title,description,type:"article",images},twitter:{card:images.length?"summary_large_image":"summary",title:story.title,description,images:story.cover_image_url?[story.cover_image_url]:[]}};
}
export default async function StoryPage({params}:{params:Promise<{slug:string}>}){
 const {slug}=await params;const supabase=await createClient();
 const {data:story,error}=await supabase.from("stories").select("id,title,slug,excerpt,body,category,published_at,cover_image_url,author_id").eq("slug",slug).eq("status","published").maybeSingle();
 if(error||!story)notFound();
 const {data:profile}=await supabase.from("profiles").select("display_name,county,bio").eq("id",story.author_id).maybeSingle();
 const content=story.body&&typeof story.body==="object"&&"content" in story.body?String((story.body as {content?:unknown}).content??""):typeof story.body==="string"?story.body:"";
 const words=content.trim()?content.trim().split(/\s+/).length:0;const minutes=Math.max(1,Math.ceil(words/220));
 return <main className="article-page"><header className="reading-header"><Link href="/" className="desk-brand"><span>afrofemme writers.</span><small>KENYAN WOMEN · THEIR WORDS · THEIR WORLD</small></Link><nav><Link href="/stories">Reading lounge</Link><Link href="/signup" className="reading-join">Join the circle ↗</Link></nav></header>
 <article className="article-shell"><Link href="/stories" className="article-back"><ArrowLeft size={15}/> Back to the reading lounge</Link><header className="article-heading"><span className="eyebrow accent">{story.category||"Story"} · KENYA</span><h1>{story.title}</h1>{story.excerpt&&<p className="article-deck">{story.excerpt}</p>}<div className="article-meta"><span>BY {profile?.display_name||"A Kenyan writer"}</span>{profile?.county&&<span><MapPin size={13}/>{profile.county}</span>}<span><Clock size={13}/>{minutes} MIN READ</span>{story.published_at&&<time dateTime={story.published_at}>{new Date(story.published_at).toLocaleDateString("en-KE",{day:"numeric",month:"long",year:"numeric"})}</time>}</div></header>
 {story.cover_image_url&&<div className="article-cover" style={{backgroundImage:"url("+JSON.stringify(story.cover_image_url)+")"}} role="img" aria-label="Story cover"/>}
 <div className="article-body">{content.split(/\n{2,}/).filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div>
 <footer className="article-end"><span>✳</span><p>Thank you for spending time with this story.</p><Link href="/stories">Discover another story <ArrowUpRight size={14}/></Link></footer><StoryCommunity storyId={story.id}/></article>
 <footer className="reading-footer"><Link href="/">Afrofemme Writers.</Link><span>Her voice. Her story. Her world.</span><Link href="/signup">Share your writing ↗</Link></footer></main>;
}