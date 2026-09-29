-- Cover publication foreign keys and collapse overlapping authenticated SELECT
-- policies so Postgres can evaluate public/owner access in one pass.

create index if not exists campaign_publications_owner_idx
  on public.campaign_publications (owner_id);

create index if not exists campaign_publications_workspace_idx
  on public.campaign_publications (workspace_id);

drop policy if exists "Everyone can read published campaign pages" on public.campaign_publications;
drop policy if exists "Owners read their campaign publications" on public.campaign_publications;

create policy "Anonymous users read published campaign pages"
on public.campaign_publications for select
to anon
using (status = 'published');

create policy "Authenticated users read allowed campaign publications"
on public.campaign_publications for select
to authenticated
using (status = 'published' or (select auth.uid()) = owner_id);
