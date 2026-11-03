import { ArrowUpRight, BookOpen, Feather, Globe2, LibraryBig, Mic2, UsersRound } from "lucide-react";

const stories = [
  {category:"Poetry · Kenya",title:"The things our mothers never named",excerpt:"A tender meditation on inheritance, silence, and the language women make for themselves.",author:"Wanjiku M.",image:"one",reading:"6 min read"},
  {category:"Personal essay · Ghana",title:"A room of my own, at last",excerpt:"On making space for a life that belongs entirely to you.",author:"Ama Serwaa",image:"two",reading:"8 min read"},
  {category:"Fiction · Nigeria",title:"When the harmattan came",excerpt:"A short story about home, distance, and the memories that travel with us.",author:"Ifeoma N.",image:"three",reading:"11 min read"}
];
const spaces = [
  {number:"01",title:"The Reading Lounge",description:"Discover new writing, revisit old favourites, and read across borders.",icon:BookOpen},
  {number:"02",title:"Sisters’ Circle",description:"Meet fellow writers, exchange ideas, find your people, and grow together.",icon:UsersRound},
  {number:"03",title:"The Ink Room",description:"Writing prompts, creative challenges, playful exercises, and room to experiment.",icon:Feather},
  {number:"04",title:"The Voices",description:"Listen to stories read aloud and hear the women behind the words.",icon:Mic2},
  {number:"05",title:"The Archive",description:"An evolving collection of African women’s stories and literary memory.",icon:LibraryBig},
  {number:"06",title:"Across the Map",description:"Find writers and literary conversations from across the continent and its diaspora.",icon:Globe2}
];

export default function Home() {
 return <main className="site-shell">
  <div className="top-note">A literary home for African women · Stories without borders</div>
  <header className="header">
   <a className="brand" href="#" aria-label="Afrofemme Writers home"><span className="brand-name">afrofemme writers</span><span className="brand-sub">Her voice. Her story. Her world.</span></a>
   <nav className="nav-links" aria-label="Main navigation"><a href="#stories">Read</a><a href="#spaces">Our spaces</a><a href="#community">Community</a><a href="#about">Our story</a></nav>
   <a className="nav-cta" href="#join">Join the circle <ArrowUpRight size={14}/></a>
  </header>
  <section className="hero">
   <div className="hero-copy"><div className="hero-kicker eyebrow">The African woman, in her own words</div>
    <h1>There is room<br/>for <em>every</em><br/>story.</h1>
    <p className="hero-description">A home for the words we carry, the worlds we imagine, and the voices that deserve to be heard. Read deeply. Write boldly. Belong fully.</p>
    <div className="hero-actions"><a className="button-dark" href="#stories">Discover the stories <ArrowUpRight size={15}/></a><a className="button-outline" href="#join">For writers</a></div>
    <p className="hero-note">Rooted in Africa. Open to the world. Always free to explore.</p>
   </div>
   <div className="hero-art" aria-label="Portrait of an African woman"><div className="hero-photo"/><div className="hero-frame"/><div className="hero-stamp"><span>Her</span><span>voice belongs here</span></div><div className="photo-caption">A new chapter · Begins with her</div></div>
  </section>
  <section className="manifesto" id="about"><div className="eyebrow">A note from our world</div><blockquote>“Our stories are not a footnote. They are the literature, the history, the becoming.”</blockquote><p>Afrofemme Writers exists to make room for African women to write, publish, read, connect, and leave their words where the next generation can find them.</p></section>
  <section className="section" id="stories">
   <div className="section-heading"><div><div className="eyebrow accent">Fresh from the page</div><h2>Stories to stay with you.</h2></div><p>Poetry, fiction, reflections, and essays from women making meaning in their own words.</p></div>
   <div className="story-grid">{stories.map(story=><article className="story-card" key={story.title}><div className={"story-image "+story.image}><span className="story-tag">{story.category}</span></div><div className="story-meta">{story.reading} <span>·</span> Editor’s selection</div><h3>{story.title}</h3><p>{story.excerpt}</p><div className="story-author">WORDS BY {story.author.toUpperCase()}</div></article>)}</div>
  </section>
  <section className="rooms" id="spaces"><div className="section"><div className="section-heading"><div><div className="eyebrow accent">More than a publication</div><h2>A place to find your people.</h2></div><p>Come for the writing. Stay for the conversations, the discovery, and the sisterhood.</p></div>
   <div className="room-grid">{spaces.map(space=>{const Icon=space.icon;return <article className="room-card" key={space.number}><div className="room-number">{space.number}<Icon size={18} className="room-icon"/></div><h3>{space.title}</h3><p>{space.description}</p><a href="#join">Explore this space ↗</a></article>})}</div>
  </div></section>
  <section className="section community" id="community"><div className="community-art" role="img" aria-label="Friends sharing a moment together"/><div className="community-copy"><div className="eyebrow accent">No woman writes alone</div><h2>Make space for the voice beside yours.</h2><p>Writing can be solitary. Becoming does not have to be. Find a circle that celebrates your words, respects your process, and makes the journey feel less like doing it all alone.</p><div className="community-list"><span>Writer profiles &amp; connections</span><span>Reading circles</span><span>Creative challenges</span><span>Community conversations</span><span>Member spotlights</span><span>Stories from across Africa</span></div><a className="button-dark" href="#join">Find your circle <ArrowUpRight size={15}/></a></div></section>
  <section className="join" id="join"><div className="eyebrow">Your words have a home</div><h2>Come as you are.<br/>Leave a little more heard.</h2><p>Whether you write every morning or are still finding the courage to begin, there is a place for you here.</p><a className="button-light" href="mailto:hello@afrofemmewriters.org?subject=Joining%20Afrofemme%20Writers">Be part of the beginning <ArrowUpRight size={15}/></a></section>
  <footer className="footer"><a className="brand" href="#"><span className="brand-name">afrofemme writers</span><span className="brand-sub">Her voice. Her story. Her world.</span></a><div className="footer-links"><a href="#stories">Read</a><a href="#spaces">Our spaces</a><a href="#community">Community</a><a href="mailto:hello@afrofemmewriters.org">Contact</a></div><span>© {new Date().getFullYear()} Afrofemme Writers</span></footer>
 </main>;
}