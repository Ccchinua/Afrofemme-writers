"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const avatars = [
 {name:"The Muse",url:"https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&w=320&q=85"},
 {name:"The Poet",url:"https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=320&q=85"},
 {name:"The Dreamer",url:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=320&q=85"},
 {name:"The Storyteller",url:"https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=320&q=85"}
];

export default function SignupPage() {
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [avatar,setAvatar]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();setBusy(true);setMessage("");
  if(password.length<8){setMessage("Choose a password with at least 8 characters.");setBusy(false);return;}
  try{
   const supabase=createClient();
   const {data,error}=await supabase.auth.signUp({email,password,options:{data:{display_name:name.trim(),avatar_url:avatar||null},emailRedirectTo:window.location.origin+"/auth/callback"}});
   if(error) throw error;
   if(data.session){window.location.assign("/member");return;}
   setMessage(data.session?"Your account is ready. Your profile picture has been saved. You can sign in.":"Check your email for a verification link. Your chosen profile picture will be saved with your new profile.");
  }catch(err){setMessage(err instanceof Error?err.message:"Unable to create your account. Please try again.");}
  finally{setBusy(false);}
 }
 return <main className="auth-page"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><section className="auth-card signup-card"><p className="eyebrow accent">Your story belongs here</p><h1>Find your place.</h1><p className="auth-intro">Create your free account to read, write, and connect with the community.</p><form onSubmit={submit} className="auth-form"><label>Your name<input required maxLength={80} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} placeholder="How should we call you?"/></label><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><label>Password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><fieldset className="avatar-picker"><legend>Choose your profile picture <span>Optional</span></legend><p>You can upload your own photo later in Profile settings.</p><div className="avatar-options">{avatars.map(item=><button type="button" key={item.name} className={avatar===item.url?"avatar-option selected":"avatar-option"} onClick={()=>setAvatar(avatar===item.url?"":item.url)} aria-pressed={avatar===item.url}><img src={item.url} alt={item.name}/><span>{item.name}</span></button>)}</div><button type="button" className="avatar-skip" onClick={()=>setAvatar("")}>Use initials instead</button></fieldset><button className="button-dark auth-submit" disabled={busy}>{busy?"Creating account…":"Create free account"}</button>{message&&<p className="auth-message" role="status">{message}</p>}</form><p className="auth-switch">Already a member? <Link href="/login">Sign in</Link></p><p className="auth-terms">By joining, you agree to treat this community with care. Please read our community guidelines.</p></section><Link href="/" className="auth-back">← Back to the journal</Link></main>;
}
