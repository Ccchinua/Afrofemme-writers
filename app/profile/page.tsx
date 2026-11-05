import {redirect} from "next/navigation";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import ProfileForm from "./profile-form";
import PortfolioManager from "./portfolio-manager";
export const dynamic="force-dynamic";
export default async function ProfilePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("display_name,username,bio,county,country,preferred_language,website_url,avatar_url,profile_frame,creative_tagline,creative_disciplines,creative_skills,collaboration_interests,open_to_collaborations").eq("id",user.id).maybeSingle();
 return <main className="profile-page"><header className="reading-header"><Link href="/" className="desk-brand"><span>afrofemme.</span><small>AFRICAN CREATIVITY · MANY VOICES · ONE COMMUNITY</small></Link><Link href="/dashboard" className="profile-back"><ArrowLeft size={15}/> Creative studio</Link></header><section className="profile-shell"><span className="eyebrow accent">YOUR PUBLIC IDENTITY</span><h1>Make your work<br/><em>known.</em></h1><p className="profile-intro">Build a public identity for your creative work. Choose your disciplines, show your skills and invite the right collaborations.</p><ProfileForm initial={profile??{display_name:String(user.user_metadata?.display_name??""),username:"",bio:"",county:"",country:"",preferred_language:"English",website_url:"",avatar_url:null,profile_frame:"woven"}}/><PortfolioManager userId={user.id}/></section></main>;
}