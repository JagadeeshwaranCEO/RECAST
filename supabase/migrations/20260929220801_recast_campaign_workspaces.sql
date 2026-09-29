-- RECAST durable campaign data. Internal workspace data remains private to its
-- authenticated owner; launch pages expose only a separately curated payload.

create table if not exists public.campaign_workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 1 and 160),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id, slug)
);

create table if not exists public.campaign_publications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.campaign_workspaces(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'published' check (status in ('published', 'archived')),
  published_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_workspaces_owner_updated_idx
  on public.campaign_workspaces (owner_id, updated_at desc);

create index if not exists campaign_publications_status_published_idx
  on public.campaign_publications (status, published_at desc);

create or replace function public.recast_set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.recast_set_updated_at() from public;

drop trigger if exists recast_workspace_updated_at on public.campaign_workspaces;
create trigger recast_workspace_updated_at
before update on public.campaign_workspaces
for each row execute function public.recast_set_updated_at();

drop trigger if exists recast_publication_updated_at on public.campaign_publications;
create trigger recast_publication_updated_at
before update on public.campaign_publications
for each row execute function public.recast_set_updated_at();

alter table public.campaign_workspaces enable row level security;
alter table public.campaign_publications enable row level security;

revoke all on public.campaign_workspaces from anon, authenticated;
revoke all on public.campaign_publications from anon, authenticated;

grant select, insert, update, delete on public.campaign_workspaces to authenticated;
grant select, insert, update, delete on public.campaign_publications to authenticated;
grant select on public.campaign_publications to anon;

create policy "Owners read their campaign workspaces"
on public.campaign_workspaces for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners create their campaign workspaces"
on public.campaign_workspaces for insert
to authenticated
with check ((select auth.uid()) = owner_id);

create policy "Owners update their campaign workspaces"
on public.campaign_workspaces for update
to authenticated
using ((select auth.uid()) = owner_id)
with check ((select auth.uid()) = owner_id);

create policy "Owners delete their campaign workspaces"
on public.campaign_workspaces for delete
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Everyone can read published campaign pages"
on public.campaign_publications for select
to anon, authenticated
using (status = 'published');

create policy "Owners read their campaign publications"
on public.campaign_publications for select
to authenticated
using ((select auth.uid()) = owner_id);

create policy "Owners create their campaign publications"
on public.campaign_publications for insert
to authenticated
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.campaign_workspaces
    where id = workspace_id
      and owner_id = (select auth.uid())
  )
);

create policy "Owners update their campaign publications"
on public.campaign_publications for update
to authenticated
using ((select auth.uid()) = owner_id)
with check (
  (select auth.uid()) = owner_id
  and exists (
    select 1
    from public.campaign_workspaces
    where id = workspace_id
      and owner_id = (select auth.uid())
  )
);

create policy "Owners delete their campaign publications"
on public.campaign_publications for delete
to authenticated
using ((select auth.uid()) = owner_id);
