# Afrofemme Writers

**Her voice. Her story. Her world.**

A free Kenyan literary home for women to write, publish, read, discover and connect.

## Product direction

Afrofemme Writers is designed as a contemporary Kenyan literary journal and writers' community. Its identity draws carefully from Kenyan places, languages, textures and everyday creative life without treating any one community as a stand-in for the whole country.

## Current implementation

- Kenyan editorial homepage with responsive layouts and a compact mobile menu.
- Supabase authentication foundation: signup, login, email callback and password reset.
- Authenticated Writer's Desk with local browser draft recovery, account draft saving, editing, publishing and deletion.
- Reading Lounge showing published stories and author attribution.
- Public article pages with reading-time estimates.
- Writer profile editor with county and language fields.
- Initial privacy, terms and community-guidelines pages.
- Supabase migrations for profiles, stories, community relationships and Kenyan county/language discovery fields.
- Row Level Security policies in the database foundation.

## Stack

- Next.js 15 App Router, React 19 and TypeScript
- Tailwind CSS 4 and custom editorial CSS
- Supabase Auth, Postgres and Storage (Storage upload policies still to be added)
- Vercel hosting

## Local setup

1. Install Node.js 20 or newer.
2. Clone this repository and run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Create a Supabase project and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
5. Apply migrations in order from `supabase/migrations` in the Supabase SQL Editor.
6. Run `npm run dev` and open http://localhost:3000.

## Supabase migrations

Apply these files in order:
- `0001_initial_schema.sql`
- `0002_kenyan_discovery.sql`

The profile editor requires the second migration. The initial owner role must be bootstrapped manually after the owner's auth account exists. Never expose the Supabase service-role key in browser code or commit secrets.

## Important limitations before launch

This repository is an active implementation, not a verified production service. Before inviting the public:
- Run the build and type checks and resolve all failures.
- Apply both database migrations and test signup, email confirmation, login, password reset, draft saving, editing, publishing and deletion against the real Supabase project.
- Configure Supabase email templates, redirect URLs and production environment variables.
- Add and test storage buckets and strict image upload policies before enabling cover/avatar uploads.
- Implement moderation/reporting workflows and trusted admin approval logic. Target permissions remain one Super Admin and no more than four Admins; no client-side role escalation is allowed.
- Implement newsletter consent and unsubscribe through a trusted endpoint before collecting subscriptions.
- Add data export/account deletion procedures, backups, rate limits, monitoring and a reviewed privacy notice and terms.
- Verify the site on real Android and iOS devices and test accessibility.

## Free launch scope

No subscriptions, tips, donations, paid memberships, payments or M-Pesa monetisation are included in the launch scope.
