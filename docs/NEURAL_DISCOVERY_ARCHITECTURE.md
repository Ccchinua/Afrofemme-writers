# Afrofemme Discovery Intelligence — Neural Recommendation Design

## Purpose
Help members discover relevant African stories, writers, creative work, prompts, events and community posts while preserving editorial control, safety and a healthy mix of voices. This is a recommendation system, not an automated editorial decision-maker.

## Current foundation
The application already has Supabase-backed member profiles, follows, community posts, reactions, replies, reposts, published stories, prompt/challenge entries, audio readings and literary events. The first release should use these existing records. Do not create a second identity graph or duplicate existing content tables.

## End-to-end pipeline

1. **Collect permitted signals** — follow edges, story/post opens, meaningful reading time, saves/reading-list actions, reactions, replies, reposts, event RSVPs, explicit topic preferences and "not interested" feedback. Do not use private message contents, sensitive profile inferences, or off-platform tracking.
2. **Normalize events** — record event type, member ID, content ID/type, timestamp and a small validated metadata object. Deduplicate retries and apply retention limits. Keep message bodies out of recommendation events.
3. **Build candidate pool** — combine followed writers, recent published content, related tags/topics, local literary events when a member explicitly chooses a location preference, and a controlled exploration pool for emerging writers.
4. **Apply hard eligibility filters** — published/visible content only; exclude hidden or removed content, blocked members, content the member has already dismissed, and anything the member is not authorized to see. Editorial status and RLS remain authoritative.
5. **Score candidates** — begin with a transparent weighted ranker. Example normalized score: 0.28 topic affinity + 0.22 follow relationship + 0.18 freshness + 0.12 meaningful engagement + 0.10 format preference + 0.10 exploration bonus. Weights are configuration, not claims of learned accuracy. Apply freshness decay and per-author frequency caps.
6. **Diversify the slate** — avoid showing many consecutive items from one author or format. Reserve a modest share for new writers and under-exposed work. Never let popularity alone determine distribution.
7. **Explain and serve** — return a reason such as "Because you follow this writer", "A topic you read", or "New voices". Provide chronological and Following feeds as user-controlled alternatives.
8. **Measure and improve** — track aggregate impressions, opens, meaningful reads, saves, hides, reports and return visits. Evaluate relevance, diversity, cold-start coverage, latency and negative feedback; do not optimize raw clicks alone.

## Neural network roadmap

### Phase A — transparent baseline (launch)
Use SQL candidate retrieval plus a deterministic weighted ranker in a server-side service. This is the correct cold-start baseline while the platform has limited interaction history. Log model version and score components for debugging. No model training or paid inference service is required.

### Phase B — learned representations (after sufficient consented data)
Train two compact embedding towers:
- **Member tower:** opted-in topic interests, followed-author IDs, coarse content-format preferences and aggregated interaction history.
- **Content tower:** title/body text embedding, tags, content type, author embedding and publication age.

The towers produce member and content vectors; approximate-nearest-neighbor retrieval supplies candidates. A small ranking model then combines similarity with freshness, relationship, quality, diversity and safety features. Use time-based train/validation/test splits and compare against Phase A before rollout.

### Phase C — contextual reranker
Only after offline and online evaluation: a lightweight neural reranker can estimate the probability of a meaningful read/save, with explicit diversity and exposure constraints outside the model. Use a shadow deployment first, then a small opt-in cohort and a kill switch.

## Data and privacy boundaries
- Never train on private direct messages or infer sensitive traits.
- Do not infer race, religion, health, sexuality, political beliefs or other sensitive characteristics.
- Treat block, report, hide and editorial moderation signals as hard constraints or negative feedback, not engagement opportunities.
- Keep RLS and existing editorial visibility rules authoritative; recommendation code must not bypass them.
- Support delete/export workflows for event data and document retention.
- Keep a chronological feed and Following feed available; recommendations must not be compulsory.

## Initial event contract
Recommended event types: `content_impression`, `content_open`, `meaningful_read`, `save`, `reaction`, `reply`, `repost`, `hide`, `report`, `follow`, `unfollow`, `event_rsvp`, `topic_preference_set`.
Each event should include `id`, `member_id`, `content_id` (nullable for profile events), `content_type`, `event_type`, `occurred_at`, `schema_version`. Avoid storing message content, raw search queries, or unnecessary device identifiers.

## Release gates
1. Existing production build succeeds.
2. Database migration is reviewed and applied only after explicit verification; no production schema changes in the design-only phase.
3. Unit tests cover eligibility, block exclusions, freshness, author caps, diversity and cold-start behavior.
4. Integration tests confirm RLS and unpublished/hidden content never leaks into recommendations.
5. Baseline ranker is compared to chronological feed using aggregate quality and diversity metrics.
6. Feature flag and rollback path are verified before enabling recommendations for members.

## Non-goals for the first release
No black-box "AI decides what you see", no private-message analysis, no paid model dependency, no automatic moderation decisions, and no claim that a neural model is trained before sufficient high-quality interaction data exists.
