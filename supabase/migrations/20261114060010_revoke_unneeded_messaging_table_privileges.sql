-- Remove DDL-only table privileges from API client roles on private messaging tables.
-- PostgREST members need DML grants plus RLS; they do not need to truncate
-- messaging tables, create triggers, or define foreign keys.
-- Existing SELECT/INSERT/UPDATE/DELETE grants and all RLS policies remain unchanged.

REVOKE TRUNCATE, REFERENCES, TRIGGER
  ON TABLE public.messages, public.conversations, public.conversation_members
  FROM anon, authenticated;
