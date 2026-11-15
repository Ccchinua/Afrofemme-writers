-- Anonymous visitors must not hold direct table privileges on private messaging data.
-- RLS policies already restrict messaging operations to authenticated participants;
-- removing anon grants adds a second, least-privilege boundary without changing
-- authenticated member access, existing rows, or conversation policies.

REVOKE ALL PRIVILEGES
  ON TABLE public.messages, public.conversations, public.conversation_members
  FROM anon;
