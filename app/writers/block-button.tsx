"use client";
import {useState} from "react";
import {createClient} from "@/lib/supabase/client";
export default function BlockButton({writerId,initialBlocked=false}:{writerId:string;initialBlocked?:boolean}){
 const [blocked,setBlocked]=useState(initialBlocked),[busy,setBusy]=useState(false),[notice,setNotice]=useState("");
 async function toggle(){const db=createClient();const {data:{user}}=await db.auth.getUser();if(!user){setNotice("Please sign in to manage blocked members.");return;}if(!blocked&&!window.confirm("Block this member? Their community posts and interactions will be hidden from each other, and private conversations will be unavailable."))return;setBusy(true);setNotice("");try{const result=blocked?await db.from("member_blocks").delete().eq("blocker_id",user.id).eq("blocked_id",writerId):await db.from("member_blocks").insert({blocker_id:user.id,blocked_id:writerId});if(result.error)throw result.error;setBlocked(!blocked);setNotice(blocked?"Member unblocked.":"Member blocked.");}catch(e){setNotice(e instanceof Error?e.message:"Could not update your block list.");}finally{setBusy(false);}}
 return <div className="profile-block-action"><button type="button" className="text-action-button" disabled={busy} onClick={toggle}>{busy?"Saving…":blocked?"Unblock member":"Block member"}</button>{notice&&<small role="status">{notice}</small>}</div>;
}
