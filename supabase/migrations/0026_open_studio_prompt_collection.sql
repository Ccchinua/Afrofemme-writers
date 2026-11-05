insert into public.writing_prompts (title,prompt,category,is_active)
select v.title,v.prompt,'Open Studio',true
from (values
 ('The room where you became yourself','Set a scene in a room that changed you. Let its objects reveal what happened there.'),
 ('A love letter to your name','Write about the sound, history or meaning of your name. You can invent a new meaning if you wish.'),
 ('When the rain came','Begin with rain arriving unexpectedly. Follow one character through the next ten minutes.'),
 ('The price of being good','Write a poem or short reflection about a rule you once followed and what it cost you.'),
 ('A city in her pocket','Imagine a woman carrying a whole city inside her pocket. What does she keep there?'),
 ('The story behind the photograph','Describe a photograph without telling the reader who took it. Reveal the truth slowly.'),
 ('A conversation across generations','Write a dialogue between two women from different generations who disagree about freedom.'),
 ('The day I chose myself','Write about a decision that looked ordinary to everyone else but changed something in you.'),
 ('A recipe for remembering','Use the language of a recipe to describe how a memory is made or preserved.'),
 ('The quietest person in the room','Write a scene from the perspective of someone who notices everything but says very little.'),
 ('A letter from the coast','Let the Indian Ocean write a letter to someone who has been away for too long.'),
 ('What we never put in the history books','Write a short piece about an everyday woman whose story deserves to be remembered.')
) as v(title,prompt)
where not exists (select 1 from public.writing_prompts p where p.title=v.title and p.category='Open Studio');
