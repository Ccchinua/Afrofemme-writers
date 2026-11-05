import {redirect} from "next/navigation";
import Link from "next/link";
import {ArrowLeft} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import ProfileForm from "./profile-form";
export const dynamic="force-dynamic";
export default async function ProfilePage(){
 const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("display_name,username,bio,county,preferred_language,website_url,avatar_url,profile_frame").eq("id",user.id).maybeSingle();
 return <main className="profile-page"><header className="reading-header"><Link href="/" className="desk-brand"><span>afrofemme writers.</span><small>KENYAN WOMEN · THEIR WORDS · THEIR WORLD</small></Link><Link href="/dashboard" className="profile-back"><ArrowLeft size={15}/> Writer's desk</Link></header><section className="profile-shell"><span className="eyebrow accent">YOUR PUBLIC IDENTITY</span><h1>Make yourself<br/><em>known.</em></h1><p className="profile-intro">Tell the community a little about the writer behind the words. Share only what feels comfortable.</p><ProfileForm initial={profile??{display_name:String(user.user_metadata?.display_name??""),username:"",bio:"",county:"",preferred_language:"English",website_url:"",avatar_url:null,profile_frame:"woven"}}/></section></main>;
}