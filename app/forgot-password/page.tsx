"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage(){
 const [email,setEmail]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");try{const supabase=createClient();const {error}=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin+"/auth/callback?next=/reset-password"});if(error)throw error;setMessage("If an account exists for that email, a password reset link is on its way.");}catch(err){setMessage(err instanceof Error?err.message:"Unable to request a reset link.");}finally{setBusy(false);}}
 return <main className="auth-page"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><section className="auth-card"><p className="eyebrow accent">A fresh start</p><h1>Reset your password.</h1><p className="auth-intro">Enter the email address connected to your account and we’ll request a reset link.</p><form onSubmit={submit} className="auth-form"><label>Email address<input type="email" required autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="button-dark auth-submit" disabled={busy}>{busy?"Sending…":"Send reset link"}</button>{message&&<p className="auth-message" role="status">{message}</p>}</form><p className="auth-switch"><Link href="/login">← Back to sign in</Link></p></section><Link href="/" className="auth-back">← Back to the journal</Link></main>;
}