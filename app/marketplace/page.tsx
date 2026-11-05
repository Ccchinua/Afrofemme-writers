import Link from "next/link";
import {redirect} from "next/navigation";
import {ArrowUpRight,BriefcaseBusiness,Palette,Sparkles} from "lucide-react";
import {createClient} from "@/lib/supabase/server";
import MarketplaceBoard from "./marketplace-board";
export const dynamic="force-dynamic";
export const metadata={title:"Creative Marketplace"};
export default async function MarketplacePage(){
 const db=await createClient();const {data:{user}}=await db.auth.getUser();
 const {data:rows,error}=await db.from("marketplace_listings").select("id,owner_id,title,description,listing_type,discipline,price_amount,currency,location,delivery_note,image_url,external_url,status,created_at").order("created_at",{ascending:false}).limit(100);
 const listings=rows??[];const ids=[...new Set(listings.map(x=>x.owner_id))];const {data:profiles}=ids.length?await db.from("profiles").select("id,display_name,username,avatar_url,county,country").in("id",ids):{data:[]};
 const profileMap=new Map((profiles??[]).map(p=>[p.id,p]));
 const hydrated=listings.map(x=>({...x,profiles:profileMap.get(x.owner_id)||null}));
 return <main className="feature-page marketplace-page"><header className="feature-header"><Link href="/" className="feature-brand">afrofemme.</Link><nav><Link href="/member">My home</Link><Link href="/creatives">Creatives</Link><Link href="/inbox">Inbox</Link><Link href="/profile">Creative Studio</Link></nav></header>
 <section className="feature-intro marketplace-intro"><span className="eyebrow accent">THE CREATIVE MARKETPLACE · AFRICA</span><h1>Good work<br/><em>deserves a market.</em></h1><p>A space for African creatives to offer their skills, sell digital work, open commissions and share paid opportunities. Discover a creator. Support their craft. Make something happen.</p><div className="marketplace-value-points"><span><Palette/> Creative services</span><span><Sparkles/> Digital work</span><span><BriefcaseBusiness/> Paid opportunities</span></div><div className="marketplace-intro-actions"><Link className="button-dark" href={user?"/marketplace#listings":"/login?next=/marketplace"}>Share your work <ArrowUpRight size={15}/></Link><Link href="/creatives">Meet the creators ↗</Link></div></section>
 <section className="marketplace-section" id="listings"><div className="marketplace-section-heading"><div><span className="eyebrow accent">THE OPEN STUDIO</span><h2>Discover what creatives are offering.</h2></div><span>Made by members · Direct connection</span></div>{error?<p className="feature-empty">Marketplace listings are temporarily unavailable. The database migration may still need to be applied.</p>:<MarketplaceBoard initialListings={hydrated} viewerId={user?.id??null}/>}</section>
 <footer className="member-footer"><Link href="/creatives">Creative directory</Link><Link href="/community">Community</Link><Link href="/community-guidelines">Guidelines</Link><Link href="/">Afrofemme Writers.</Link></footer></main>;
}
