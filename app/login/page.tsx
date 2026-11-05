"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  try{
   const supabase=createClient();
   const {error}=await supabase.auth.signInWithPassword({email,password});
   if(error) throw error;
   const requested=new URLSearchParams(window.location.search).get("next");\n   const destination=requested&&requested.startsWith("/")&&!requested.startsWith("//")?requested:"/member";\n   window.location.assign(destination);
  }catch(err){setMessage(err instanceof Error?err.message:"Unable to sign in. Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><section className="auth-card"><p className="eyebrow accent">Welcome back</p><h1>Come on in.</h1><p className="auth-intro">Your reading list, your writing desk, your circle — they’re waiting.</p><form onSubmit={submit} className="auth-form"><label>Email address<input type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" autoComplete="current-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Your password"/></label><div className="auth-help"><Link href="/forgot-password">Forgot password?</Link></div><button className="button-dark auth-submit" disabled={busy}>{busy?"Signing in…":"Sign in"}</button>{message&&<p className="auth-message" role="alert">{message}</p>}</form><p className="auth-switch">New to the circle? <Link href="/signup">Create an account</Link></p></section><Link href="/" className="auth-back">← Back to the journal</Link></main>;
}