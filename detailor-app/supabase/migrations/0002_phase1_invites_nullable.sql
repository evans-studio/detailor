-- Phase 1 follow-up: allow null inviter for initial onboarding
alter table public.tenant_invites
  alter column invited_by drop not null;


