insert into public.writing_prompts (title,prompt,category,is_active)
select v.title,v.prompt,'Daily Ink',true
from (values
 ('A small rebellion','Write about a small thing you did differently, even when the world expected you to stay the same.'),
 ('The sound of home','Describe a sound that takes you home. Let the sound lead the story before you explain it.'),
 ('A woman in the mirror','Write a letter to a version of yourself you have not met yet.'),
 ('The unsent message','Write the message you drafted, deleted, and never sent. You may change the names and details.'),
 ('What the land remembers','Choose a place in Kenya and imagine what it would say if it could remember every person who passed through.'),
 ('A borrowed word','Take a word from a language you grew up hearing. Build a poem or scene around what it means to you.'),
 ('The ordinary miracle','Write about an ordinary moment that quietly changed the direction of your day.'),
 ('The women at the table','Create a scene around women sharing a meal. What is said, and what remains unspoken?'),
 ('An inheritance without objects','Write about something you inherited that could never fit inside a suitcase.'),
 ('The first brave sentence','Begin with the sentence: I did not know I was allowed to… and follow it wherever it goes.'),
 ('A map of memory','Describe three places that shaped you without naming any of them directly.'),
 ('The future is listening','Write a short note to a girl who will read your words ten years from now.')
) as v(title,prompt)
where not exists (
 select 1 from public.writing_prompts p
 where p.title=v.title and p.category='Daily Ink'
);
