import { ArrowUpRight, BookOpen, Feather, MapPin, Mic2, PenLine, UsersRound } from "lucide-react";

const stories = [
  {category:"Poetry",title:"The things our mothers never named",excerpt:"A tender meditation on inheritance, silence, and the language women make for themselves.",author:"Wanjiku M.",place:"Nairobi",image:"one",reading:"6 min read"},
  {category:"Personal essay",title:"A room of my own, at last",excerpt:"On making space for a life that belongs entirely to you.",author:"Achieng O.",place:"Kisumu",image:"two",reading:"8 min read"},
  {category:"Fiction",title:"Where the jacarandas fall",excerpt:"A story of returning home, old friendships and the things a city remembers.",author:"Naliaka W.",place:"Nakuru",image:"three",reading:"11 min read"}
];
const spaces = [
  {number:"01",title:"The Reading Lounge",description:"Discover new writing, revisit old favourites and spend time with stories that stay.",icon:BookOpen},
  {number:"02",title:"Sisters’ Circle",description:"Find fellow writers, exchange ideas and build a generous creative community.",icon:UsersRound},
  {number:"03",title:"The Ink Room",description:"Writing prompts, creative challenges and room to experiment without judgement.",icon:Feather},
  {number:"04",title:"The Voices",description:"Hear Kenyan women read their work and tell the stories behind the words.",icon:Mic2}
];
export default function Home() {
 return <main className="site-shell kenya-site">
  <div className="top-note">A home for Kenyan women who write · Always free to explore</div>
  <header className="header">
   <a className="brand" href="/" aria-label="Afrofemme Writers home"><span className="brand-name">afrofemme writers<span className="brand-period">.</span></span><span className="brand-sub">Her voice. Her story. Her world.</span></a>
   <nav className="nav-links" aria-label="Main navigation"><a href="/stories">Read</a><a href="#spaces">Our spaces</a><a href="/writers">Writers</a><a href="/events">Calendar</a><a href="/spotlight">Spotlight</a></nav><details className="mobile-menu"><summary aria-label="Open navigation">Menu <span>＋</span></summary><div><a href="/stories">Reading lounge</a><a href="#spaces">Our spaces</a><a href="#voices">Voices of Kenya</a><a href="/login">Sign in</a></div></details>
   <a className="nav-cta" href="/signup">Join the circle <ArrowUpRight size={14}/></a>
  </header>
  <section className="hero kenya-hero">
   <div className="hero-copy"><div className="hero-kicker eyebrow">A Kenyan literary home</div>
    <h1>Our stories.<br/>Our <em>words.</em><br/>Our world.</h1>
    <p className="hero-description">A place for Kenyan women to write, publish, read and find one another. From the city to the coast, from the highlands to the lakeside — every voice has room here.</p>
    <div className="hero-actions"><a className="button-dark" href="#stories">Explore the stories <ArrowUpRight size={15}/></a><a className="button-outline" href="/signup">Start writing</a></div>
    <p className="hero-note"><MapPin size={13}/> Rooted in Kenya. Open to every story.</p>
   </div>
   <div className="hero-art" aria-label="Portrait celebrating Kenyan women writers"><div className="hero-photo"/><div className="hero-frame"/><div className="hero-stamp"><span>Sauti</span><span>Every voice belongs</span></div><div className="photo-caption">Kenyan women · Unwritten no more</div><div className="hero-art-label">01 / THE NEW KENYAN LITERARY VOICE</div></div>
  </section>
  <section className="kenya-ribbon" aria-label="Kenyan literary inspiration"><span>NAIROBI</span><i>✳</i><span>MOMBASA</span><i>✳</i><span>KISUMU</span><i>✳</i><span>NYERI</span><i>✳</i><span>EVERY COUNTY</span></section>
  <section className="manifesto" id="about"><div className="eyebrow">A note from our world</div><blockquote>“Our stories are not a footnote. They are the literature, the history, the becoming.”</blockquote><p>Afrofemme Writers is a home for Kenyan women to shape the stories of who we are, where we come from and what we are becoming.</p></section>
  <section className="section" id="stories">
   <div className="section-heading"><div><div className="eyebrow accent">Fresh from the page</div><h2>Stories to stay with you.</h2></div><p>Poetry, fiction, reflections and essays from Kenyan women making meaning in their own words.</p></div>
   <div className="story-grid">{stories.map(story=><article className="story-card" key={story.title}><div className={"story-image "+story.image}><span className="story-tag">{story.category}</span><span className="story-place"><MapPin size={11}/>{story.place}</span></div><div className="story-meta">{story.reading} <span>·</span> Editor's selection</div><h3>{story.title}</h3><p>{story.excerpt}</p><div className="story-author">WORDS BY {story.author.toUpperCase()}</div></article>)}</div>
   <div className="editorial-more"><span>There are more voices waiting to be discovered.</span><a href="/signup">Explore the community <ArrowUpRight size={14}/></a></div>
  </section>
  <section className="rooms" id="spaces"><div className="section"><div className="section-heading"><div><div className="eyebrow accent">More than a publication</div><h2>A place to find your people.</h2></div><p>Come for the writing. Stay for the conversations, discovery and sisterhood.</p></div>
   <div className="room-grid">{spaces.map(space=>{const Icon=space.icon;return <article className="room-card" key={space.number}><div className="room-number">{space.number}<Icon size={18} className="room-icon"/></div><h3>{space.title}</h3><p>{space.description}</p><a href={space.number==="01"?"/stories":space.number==="02"?"/community":space.number==="03"?"/prompts":"/voices"}>Enter this space ↗</a></article>})}</div>
  </div></section>
  <section className="kenya-voices" id="voices"><div className="voices-copy"><div className="eyebrow accent">One country. Countless perspectives.</div><h2>From every corner<br/>of <em>Kenya.</em></h2><p>Our lives are shaped by the places we call home. We want to make space for stories from every county, language and lived experience.</p><a className="text-link" href="/signup">Add your voice <ArrowUpRight size={15}/></a></div><div className="county-board"><div className="county-board-top"><span>THE VOICES OF KENYA</span><span>001 — 047</span></div><div className="county-list"><span>Nairobi</span><span>Mombasa</span><span>Kisumu</span><span>Kiambu</span><span>Nyeri</span><span>Turkana</span><span>Garissa</span><span>Machakos</span><span>Meru</span><span>Uasin Gishu</span><span>Kwale</span><span>Everywhere else</span></div><p>County is a starting point, never a boundary.</p></div></section>
  <section className="section community" id="community"><div className="community-art" role="img" aria-label="Women sharing a moment together"/><div className="community-copy"><div className="eyebrow accent">No woman writes alone</div><h2>Make space for the voice beside yours.</h2><p>Writing can be solitary. Becoming does not have to be. Find a circle that celebrates your words, respects your process and makes the journey feel less like doing it all alone.</p><div className="community-list"><span>Writer profiles &amp; connections</span><span>Reading circles</span><span>Creative challenges</span><span>Community conversations</span><span>Member spotlights</span><span>Stories from across Kenya</span></div><a className="button-dark" href="/signup">Find your circle <ArrowUpRight size={15}/></a></div></section>
  <section className="join" id="join"><div className="eyebrow">Your words have a home</div><h2>Come as you are.<br/>Leave a little more heard.</h2><p>Whether you write every morning or are still finding the courage to begin, there is a place for you here.</p><a className="button-light" href="/signup">Create your free account <ArrowUpRight size={15}/></a></section>
  <footer className="footer"><a className="brand" href="/"><span className="brand-name">afrofemme writers<span className="brand-period">.</span></span><span className="brand-sub">Her voice. Her story. Her world.</span></a><div className="footer-links"><a href="/stories">Read</a><a href="#spaces">Our spaces</a><a href="#voices">Voices of Kenya</a><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/community-guidelines">Guidelines</a><a href="mailto:afrofemmewritingclub@gmail.com">Contact</a><a href="/login">Sign in</a></div><span>© {new Date().getFullYear()} Afrofemme Writers</span></footer>
 </main>;
}