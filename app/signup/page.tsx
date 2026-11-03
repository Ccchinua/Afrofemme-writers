"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  if(password.length<8){setMessage("Choose a password with at least 8 characters.");setBusy(false);return;}
  try{
   const supabase=createClient();
   const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim()},emailRedirectTo:window.location.origin+"/auth/callback"}});
   if(error) throw error;
   setMessage(data.session?"Your account is ready. You can sign in.":"Check your email for a verification link before signing in.");
  }catch(err){setMessage(err instanceof Error?err.message:"Unable to create your account. Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><section className="auth-card"><p className="eyebrow accent">Your story belongs here</p><h1>Find your place.</h1><p className="auth-intro">Create your free account to read, write, and connect with the community.</p><form onSubmit={submit} className="auth-form"><label>Your name<input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="How should we call you?"/></label><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><button className="button-dark auth-submit" disabled={busy}>{busy?"Creating account…":"Create free account"}</button>{message&&<p className="auth-message" role="status">{message}</p>}</form><p className="auth-switch">Already a member? <Link href="/login">Sign in</Link></p><p className="auth-terms">By joining, you agree to treat this community with care. Community guidelines and terms will be added before public launch.</p></section><Link href="/" className="auth-back">← Back to the journal</Link></main>;
}