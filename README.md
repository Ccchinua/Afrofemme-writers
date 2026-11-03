# Afrofemme Writers

**Her voice. Her story. Her world.**

A free literary home for African women to publish, read, discover, and connect.

## Current build

The first foundation includes:
- A responsive editorial homepage and Afrofemme visual identity.
- Next.js App Router, React, and TypeScript.
- Supabase browser/server client helpers.
- An initial Postgres schema with Row Level Security (RLS) for profiles, stories, follows, likes, bookmarks, comments, admin requests, and newsletter subscribers.

This is an active foundation, **not yet a production-ready platform**. Authentication screens, publishing workflows, moderation tools, email delivery, storage policies, admin approval endpoints, tests, and deployment configuration still need to be implemented and verified.

## Stack

- Next.js 15 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase Auth, Postgres, and Storage (to be configured)
- Resend email delivery (to be configured)
- Vercel deployment (to be configured)

## Run locally

1. Install Node.js 20 or newer.
2. Clone this repository.
3. Run `npm install`.
4. Copy `.env.example` to `.env.local`.
5. Create a Supabase project and add its URL and anon key to `.env.local`.
6. Apply `supabase/migrations/0001_initial_schema.sql` in the Supabase SQL Editor.
7. Run `npm run dev` and open http://localhost:3000.

## Environment variables

See `.env.example`. Keep `SUPABASE_SERVICE_ROLE_KEY` and `RESEND_API_KEY` server-only. Never prefix secrets with `NEXT_PUBLIC_`.

## Admin security

The target is one Super Admin and up to four Admins. No public sign-up flow may grant roles. Role assignment must be enforced by trusted server-side logic and database policies. The initial schema has no client-side role write policy. The owner role must be bootstrapped manually in the trusted Supabase SQL Editor after the owner's account exists. The four-admin limit and approval flow still need a transactional server implementation before enabling admin requests.

## Free launch

No paid subscriptions, tips, donations, payments, or M-Pesa monetisation are part of the launch scope.

## Before production

Complete and test email verification, password reset, session refresh, publishing workflows, image upload restrictions, moderation, spam controls, admin approval, newsletter consent/unsubscribe, privacy/terms pages, backups, accessibility, and deployment secrets. Do not describe the site as production-ready until these checks pass.
