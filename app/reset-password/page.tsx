"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage(){
 const [password,setPassword]=useState("");const [message,setMessage]=useState("");const [busy,setBusy]=useState(false);
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMessage("");if(password.length<8){setMessage("Use at least 8 characters.");setBusy(false);return;}try{const supabase=createClient();const {error}=await supabase.auth.updateUser({password});if(error)throw error;setMessage("Your password has been updated. You can now sign in.");}catch(err){setMessage(err instanceof Error?err.message:"Unable to update your password. Request a new reset link.");}finally{setBusy(false);}}
 return <main className="auth-page"><Link href="/" className="auth-brand">afrofemme writers<span>Her voice. Her story. Her world.</span></Link><section className="auth-card"><p className="eyebrow accent">A fresh start</p><h1>Choose a new password.</h1><p className="auth-intro">Make it strong and keep it somewhere safe.</p><form onSubmit={submit} className="auth-form"><label>New password<input type="password" required minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label><button className="button-dark auth-submit" disabled={busy}>{busy?"Updating…":"Update password"}</button>{message&&<p className="auth-message" role="status">{message}</p>}</form><p className="auth-switch"><Link href="/login">Return to sign in</Link></p></section><Link href="/" className="auth-back">← Back to the journal</Link></main>;
}