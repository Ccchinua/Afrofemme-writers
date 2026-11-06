import Link from "next/link";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import ModerationQueue from "./moderation-queue";
import MeetupProposalReview from "./meetup-proposal-review";
import MeetupAttendance from "./meetup-attendance";
import ChallengeManager from "./challenge-manager";
export const metadata={title:"Editorial Admin"};
export default async function AdminPage(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login");
 const {data:roles}=await db.from("app_roles").select("role").eq("user_id",user.id);
 if(!roles?.some(r=>r.role==="admin"||r.role==="super_admin"))redirect("/dashboard");
 const {data:challenges}=await db.from("community_challenges").select("id,title,description,prompt,starts_at,ends_at,status,created_at").order("created_at",{ascending:false}).limit(30);
 const {data:meetupProposals}=await db.from("meetup_proposals").select("id,proposer_id,title,description,event_type,county,venue,proposed_at,capacity,host_name,contact_note,status").eq("status","pending").order("created_at",{ascending:true}).limit(100);
 const {data:reports}=await db.from("content_reports").select("id,target_type,target_id,reason,status,created_at,reporter_id").order("created_at",{ascending:false}).limit(100);
 const {data:meetupEvents}=await db.from("literary_events").select("id,title,starts_at,event_registrations(id,user_id,attendance_status,registered_at)").eq("is_meetup",true).order("starts_at",{ascending:false}).limit(50);
 const memberIds=Array.from(new Set((meetupEvents??[]).flatMap((ev:any)=>(ev.event_registrations??[]).map((r:any)=>r.user_id))));
 const {data:memberProfiles}=memberIds.length?await db.from("profiles").select("id,display_name,username").in("id",memberIds):{data:[]};
 const profileMap=new Map((memberProfiles??[]).map((p:any)=>[p.id,p.display_name||p.username||"Community member"]));
 const attendance=(meetupEvents??[]).map((ev:any)=>({...ev,event_registrations:(ev.event_registrations??[]).map((r:any)=>({...r,member_name:profileMap.get(r.user_id)||"Community member"}))}));
 const isSuperAdmin=roles.some(r=>r.role==="super_admin");
 const {data:requests}=isSuperAdmin?await db.from("admin_requests").select("id,requester_id,reason,status,created_at").eq("status","pending").order("created_at"): {data:[]};
 if(isSuperAdmin){
  const [membersCount,storiesCount,postsCount,openReportsCount,eventsCount]=await Promise.all([
   db.from("profiles").select("id",{count:"exact",head:true}),
   db.from("stories").select("id",{count:"exact",head:true}).eq("status","published"),
   db.from("circle_posts").select("id",{count:"exact",head:true}).eq("is_hidden",false),
   db.from("content_reports").select("id",{count:"exact",head:true}).eq("status","open"),
   db.from("literary_events").select("id",{count:"exact",head:true}).gte("starts_at",new Date().toISOString())
  ]);
  const metrics=[
   {label:"Community members",value:membersCount.count??0,detail:"Registered profiles",href:"/writers",symbol:"✳"},
   {label:"Published stories",value:storiesCount.count??0,detail:"Live in the reading room",href:"/stories",symbol:"↗"},
   {label:"Community posts",value:postsCount.count??0,detail:"Visible conversations",href:"/feed",symbol:"◎"},
   {label:"Open reports",value:openReportsCount.count??0,detail:"Require moderation",href:"/admin#reports",symbol:"!"},
   {label:"Upcoming events",value:eventsCount.count??0,detail:"On the community calendar",href:"/gatherings",symbol:"⌖"}
  ];
  return <main className="sa-shell">
   <header className="sa-top"><Link href="/" className="sa-brand">afrofemme<span>.</span></Link><div><span className="sa-lock">✳ SUPER ADMIN / PRIVATE</span><Link href="/dashboard">Writer’s desk ↗</Link><Link href="/">View website ↗</Link></div></header>
   <section className="sa-welcome"><div><span className="sa-kicker">THE AFROFEMME CONTROL ROOM</span><h1>Good morning.<br/><em>Take the lead.</em></h1><p>One place to understand the health of the community, protect its members and steer what happens next.</p></div><div className="sa-seal"><span>AF</span><small>THE VOICE<br/>IS THE POWER</small></div></section>
   <section className="sa-metrics">{metrics.map((m)=><Link href={m.href} className={"sa-metric "+(m.label==="Open reports"&&m.value>0?"sa-alert":"")} key={m.label}><span>{m.symbol}</span><small>{m.label}</small><strong>{m.value.toLocaleString("en-KE")}</strong><em>{m.detail} ↗</em></Link>)}</section>
   <section className="sa-workspace"><div className="sa-main-panel"><div className="sa-panel-head"><div><span className="sa-kicker">PLATFORM OPERATIONS</span><h2>Keep the network healthy.</h2></div><span className="sa-status">● SYSTEM OVERVIEW</span></div><div className="sa-action-grid">
    <Link href="/admin#reports"><b>01</b><strong>Trust &amp; safety</strong><p>Review reports, respond to harmful content and keep the community safe.</p><span>Open moderation ↗</span></Link>
    <Link href="/stories"><b>02</b><strong>Open publishing</strong><p>Writers publish their own stories directly. Admin attention stays focused on community safety.</p><span>View the Reading Lounge ↗</span></Link>
    <Link href="/admin"><b>03</b><strong>Community programming</strong><p>Oversee writing challenges, circles, gatherings and member proposals.</p><span>Manage programmes ↗</span></Link>
    <Link href="/admin#requests"><b>04</b><strong>Administrator access</strong><p>Review pending requests for elevated platform responsibilities.</p><span>{requests?.length??0} pending requests ↗</span></Link>
    <Link href="/discover"><b>05</b><strong>Discovery &amp; growth</strong><p>Explore the member network and see how the public community appears.</p><span>Explore network ↗</span></Link>
    <Link href="/gatherings"><b>06</b><strong>Events &amp; gatherings</strong><p>Keep the online community connected to real-world experiences.</p><span>View calendar ↗</span></Link>
   </div></div><aside className="sa-side-panel"><span className="sa-kicker">NEEDS YOUR ATTENTION</span><h2>Admin requests</h2><strong className="sa-request-number">{requests?.length??0}</strong><p>Pending requests for administrator access.</p>{requests?.length?requests.slice(0,5).map((r:any)=><article className="sa-request" key={r.id}><b>Access request</b><small>{r.reason}</small><time>{new Date(r.created_at).toLocaleDateString("en-KE")}</time></article>):<div className="sa-clear">✳<br/>All caught up.<small>No pending access requests.</small></div>}<Link href="/admin#requests" className="sa-text-link">Review access queue ↗</Link></aside></section>
   <section className="sa-bottom"><div><span className="sa-kicker">A NOTE ON RESPONSIBILITY</span><p>Super Admin powers are reserved for platform stewardship. Editorial admins can manage approved workflows, but cannot grant themselves elevated access.</p></div><Link href="/admin">Open full operations desk ↗</Link></section>
   <footer className="sa-footer"><span>AFROFEMME WRITERS · SUPER ADMIN</span><span>HER VOICE. HER STORY. HER WORLD.</span></footer>
  </main>;
 }
 return <main className="feature-page">
 <header className="feature-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/dashboard">Writer’s desk</Link><Link href="/gatherings">Gatherings</Link><Link href="/">Home</Link></nav></header>
 <section className="feature-intro"><span className="eyebrow accent">PRIVATE · EDITORIAL OPERATIONS</span><h1>Care for the<br/><em>community.</em></h1><p>Protect the writing space. Review reports and act on genuine community-guideline violations.</p></section>
 <MeetupProposalReview initial={(meetupProposals??[]) as any[]}/>
 <MeetupAttendance initial={attendance as any[]}/>
 <ChallengeManager initial={(challenges??[]) as any[]} userId={user.id}/>
 <EditorialReview initial={(submissions??[]) as any[]}/>
 <section className="feature-list"><div className="feature-list-head"><div><span className="eyebrow accent">MODERATION</span><h2>Reported content</h2></div><span>{reports?.filter(r=>r.status==="open").length??0} open</span></div><ModerationQueue reports={reports??[]}/></section>
 {roles.some(r=>r.role==="super_admin")&&<section className="feature-list" style={{marginTop:60}}><div className="feature-list-head"><div><span className="eyebrow accent">SUPER ADMIN ONLY</span><h2>Admin access requests</h2></div><span>{requests?.length??0} pending</span></div>{!requests?.length?<p className="feature-empty">No pending requests.</p>:requests.map((r:any)=><article className="feature-card" key={r.id}><h3>Request for administrator access</h3><p>{r.reason}</p><small>Requester: {r.requester_id} · {new Date(r.created_at).toLocaleDateString()}</small><p>Review and grant roles through the protected server-side approval workflow.</p></article>)}</section>}
 </main>;
}