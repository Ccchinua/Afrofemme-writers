import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import WriterDesk from "./writer-desk";
export default async function DashboardPage(){
 const supabase=await createClient();
 const {data:{user}}=await supabase.auth.getUser();
 if(!user) redirect("/login");
 const {data:profile}=await supabase.from("profiles").select("display_name").eq("id",user.id).maybeSingle();
 const name=String(profile?.display_name||user.user_metadata?.display_name||"Writer").trim()||"Writer";
 const {data:stories}=await supabase.from("stories").select("id,title,category,status,updated_at,excerpt,body").eq("author_id",user.id).order("updated_at",{ascending:false}).limit(30);
 return <WriterDesk displayName={name} email={user.email??""} initialStories={stories??[]}/>;
}