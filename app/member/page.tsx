import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowUpRight,BookOpen,Bookmark,CalendarDays,Feather,Heart,PenLine,Sparkles,UsersRound} from "lucide-react";
import {createClient} from "@/lib/supabase/server";

export const dynamic="force-dynamic";
export const metadata={title:"Your Afrofemme home"};

type Story={id:string;title:string;slug:string;excerpt:string|null;category:string|null;published_at:string|null;author_id:string;county:string|null;language:string|null;cover_image_url:string|null};
type Writer={id:string;display_name:string|null;county:string|null;avatar_url:string|null;username:string|null};

export default async function MemberHome(){
 const db=await createClient();
 const {data:{user}}=await db.auth.getUser();
 if(!user)redirect("/login?next=/member");
 const [profileResult,ownStoriesResult,storyCountResult,bookmarkCountResult,followingResult,followerCountResult,unreadResult,challengeResult,eventResult]=await Promise.all([
  db.from("profiles").select("display_name,username,bio,county,preferred_language,avatar_url").eq("id",user.id).maybeSingle(),
  db.from("stories").select("id,title,slug,status,updated_at,category").eq("author_id",user.id).order("updated_at",{ascending:false}).limit(4),
  db.from("stories").select("id",{count:"exact",head:true}).eq("author_id",user.id),
  db.from("bookmarks").select("story_id",{count:"exact",head:true}).eq("user_id",user.id),
  db.from("follows").select("followed_id",{count:"exact"}).eq("follower_id",user.id).limit(12),
  db.from("follows").select("follower_id",{count:"exact",head:true}).eq("followed_id",user.id),
  db.from("member_notifications").select("id",{count:"exact",head:true}).eq("user_id",user.id).is("read_at",null),
  db.from("community_challenges").select("id,title,description,prompt,ends_at").eq("status","open").order("ends_at",{ascending:true}).limit(1).maybeSingle(),
  db.from("literary_events").select("id,title,county,venue,starts_at").eq("is_published",true).gte("starts_at",new Date().toISOString()).order("starts_at",{ascending:true}).limit(1).maybeSingle()
 ]);
 const profile=profileResult.data;
 const name=profile?.display_name||user.user_metadata?.display_name||"Writer";
 const followedIds=(followingResult.data??[]).map(x=>x.followed_id).filter(Boolean);
 const recQueries=[
  db.from("stories").select("id,title,slug,excerpt,category,published_at,author_id,county,language,cover_image_url").eq("status","published").neq("author_id",user.id).order("published_at",{ascending:false}).limit(8)
 ];
 if(profile?.county)recQueries.push(db.from("stories").select("id,title,slug,excerpt,category,published_at,author_id,county,language,cover_image_url").eq("status","published").eq("county",profile.county).neq("author_id",user.id).order("published_at",{ascending:false}).limit(8));
 if(followedIds.length)recQueries.push(db.from("stories").select("id,title,slug,excerpt,category,published_at,author_id,county,language,cover_image_url").eq("status","published").in("author_id",followedIds).order("published_at",{ascending:false}).limit(8));
 const recResults=await Promise.all(recQueries);
 const recMap=new Map<string,Story>();
 for(const result of recResults)for(const story of (result.data??[]) as Story[])recMap.set(story.id,story);
 const recommendations=[...recMap.values()].sort((a,b)=>new Date(b.published_at||0).getTime()-new Date(a.published_at||0).getTime()).slice(0,6);
 const writerIds=[...new Set(recommendations.map(s=>s.author_id))];
 const {data:authors}=writerIds.length?await db.from("profiles").select("id,display_name,county,avatar_url,username").in("id",writerIds):{data:[] as Writer[]};
 const authorMap=new Map((authors??[]).map(a=>[a.id,a]));
 const profileComplete=Boolean(profile?.username&&profile?.bio&&profile?.county);
 const stats=[
  {label:"Your stories",value:storyCountResult.count??0,icon:BookOpen,href:"/dashboard"},
  {label:"Saved stories",value:bookmarkCountResult.count??0,icon:Bookmark,href:"/reading-list"},
  {label:"Following",value:followingResult.count??0,icon:Heart,href:"/writers"},
  {label:"Followers",value:followerCountResult.count??0,icon:UsersRound,href:"/journey"}
 ];
 return <main className="member-home">
  <header className="member-header"><Link href="/" className="feature-brand">afrofemme writers.</Link><nav><Link href="/stories">Read</Link><Link href="/writers">Find writers</Link><Link href="/feed">Community</Link><Link href="/notifications">Inbox{(unreadResult.count??0)>0?<span className="member-unread">{unreadResult.count}</span>:null}</Link><Link href="/profile">Profile</Link></nav></header>
  <section className="member-welcome">
   <div className="member-welcome-copy"><span className="eyebrow">YOUR MEMBER HOME · {profile?.county||"KENYA"}</span><h1>Welcome back,<br/><em>{name}.</em></h1><p>Your words have a place here. Find something to read, make a little progress or reconnect with your community.</p>
    <div className="member-primary-actions"><Link className="button-light" href="/dashboard"><PenLine size={15}/> Open Writer’s Desk <ArrowUpRight size={14}/></Link><Link className="member-secondary-action" href="/stories">Find a story to read ↗</Link></div>
   </div>
   <div className="member-welcome-aside">{profile?.avatar_url?<img src={profile.avatar_url} alt="" className="member-profile-photo"/>:<div className="member-profile-initial">{String(name).slice(0,1).toUpperCase()}</div>}<span className="eyebrow">YOUR WRITER PROFILE</span><strong>{name}</strong><small>{profile?.county||"Your county"} · {profile?.preferred_language||"Your language"}</small><Link href="/profile">Edit your profile ↗</Link></div>
  </section>
  {!profileComplete&&<section className="member-profile-nudge"><Sparkles size={18}/><div><strong>Make your profile easier to discover.</strong><p>Add a username, a short bio and your county so readers and writers can find you.</p></div><Link href="/profile">Complete profile ↗</Link></section>}
  <section className="member-stats">{stats.map(item=>{const Icon=item.icon;return <Link href={item.href} className="member-stat" key={item.label}><Icon size={18}/><strong>{item.value}</strong><span>{item.label}</span></Link>})}</section>
  <section className="member-shortcuts"><div className="member-section-heading"><div><span className="eyebrow accent">A PLACE TO BEGIN</span><h2>Your spaces</h2></div><span>Choose what feels right today</span></div><div className="member-shortcut-grid">
   <Link href="/dashboard"><PenLine/><span><strong>Write something</strong><small>Start a story or return to a draft</small></span><ArrowUpRight/></Link>
   <Link href="/reading-list"><Bookmark/><span><strong>Your reading shelf</strong><small>Saved stories and recent reading</small></span><ArrowUpRight/></Link>
   <Link href="/feed"><UsersRound/><span><strong>Join the conversation</strong><small>See what your community is sharing</small></span><ArrowUpRight/></Link>
   <Link href="/journey"><Sparkles/><span><strong>Your writing journey</strong><small>Follow your milestones and connections</small></span><ArrowUpRight/></Link>
  </div></section>
  <section className="member-content-grid">
   <div className="member-panel"><div className="member-section-heading"><div><span className="eyebrow accent">YOUR WRITING</span><h2>Back to your desk</h2></div><Link href="/dashboard">All your work ↗</Link></div>
    {!ownStoriesResult.data?.length?<div className="member-empty"><Feather/><h3>Your first page is waiting.</h3><p>Begin with a thought, a memory or a question you cannot leave alone.</p><Link href="/dashboard">Write your first story ↗</Link></div>:ownStoriesResult.data.map(s=><Link href="/dashboard" className="member-work-row" key={s.id}><span className="member-work-icon"><BookOpen size={17}/></span><span><strong>{s.title}</strong><small>{s.category||"Writing"} · Updated {new Date(s.updated_at).toLocaleDateString("en-KE")}</small></span><i>{s.status}</i></Link>)}
   </div>
   <div className="member-panel member-next-panel"><span className="eyebrow">YOUR NEXT INVITATION</span>{challengeResult.data?<><h2>{challengeResult.data.title}</h2><p>{challengeResult.data.description||challengeResult.data.prompt}</p><Link href="/challenges">Explore this week’s challenge ↗</Link></>:<><h2>Make room for a new idea.</h2><p>Visit Daily Ink for a prompt, or explore the community to see what other writers are making.</p><Link href="/prompts">Find a writing prompt ↗</Link></>}{eventResult.data&&<div className="member-event-note"><CalendarDays size={16}/><span><strong>{eventResult.data.title}</strong><small>{new Date(eventResult.data.starts_at).toLocaleDateString("en-KE",{day:"numeric",month:"short"})} · {eventResult.data.county||eventResult.data.venue||"Afrofemme gathering"}</small><Link href="/gatherings">Meet the community ↗</Link></span></div>}</div>
  </section>
  <section className="member-recommendations"><div className="member-section-heading"><div><span className="eyebrow accent">A LITTLE READING FOR YOU</span><h2>Voices worth discovering.</h2></div><Link href="/stories">Explore the reading lounge ↗</Link></div>
   {!recommendations.length?<p className="member-empty-inline">The reading shelf is growing. Be among the first to <Link href="/dashboard">publish a story</Link>.</p>:<div className="member-recommend-grid">{recommendations.map((story,index)=>{const writer=authorMap.get(story.author_id);return <article className="member-recommend-card" key={story.id}><div className={"member-recommend-art member-art-"+(index%3)} style={story.cover_image_url?{backgroundImage:"url("+JSON.stringify(story.cover_image_url)+")"}:undefined}><span>{story.category||"Story"}</span></div><div className="member-recommend-copy"><small>{writer?.display_name||"Afrofemme writer"}{writer?.county?" · "+writer.county:""}</small><h3><Link href={"/stories/"+encodeURIComponent(story.slug)}>{story.title}</Link></h3><p>{story.excerpt||"A new voice from the Afrofemme community."}</p><Link href={"/stories/"+encodeURIComponent(story.slug)}>Read story ↗</Link></div></article>})}</div>}
  </section>
  <footer className="member-footer"><Link href="/stories">Reading lounge</Link><Link href="/writers">Writer directory</Link><Link href="/gatherings">Gatherings</Link><Link href="/privacy">Privacy</Link><Link href="/">Afrofemme Writers.</Link></footer>
 </main>;
}
