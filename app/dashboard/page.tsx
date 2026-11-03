import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const name=String(user.user_metadata?.display_name??"Writer").trim()||"Writer";
 return <main className="member-page"><header className="member-header"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><span className="member-email">{user.email}</span></header><section className="member-welcome"><p className="eyebrow accent">Your corner of the community</p><h1>Welcome, {name}.</h1><p>Your account is connected. The writing desk and community features are the next pieces being built.</p><div className="member-actions"><Link href="/" className="button-dark">Explore the journal</Link><Link href="/login" className="button-outline">Return to sign in</Link></div></section></main>;
}