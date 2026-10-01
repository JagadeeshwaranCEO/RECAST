-- Distributed AI quota and bounded campaign payloads for the production studio.

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.recast_agent_quotas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count between 1 and 9),
  updated_at timestamptz not null default now()
);

alter table private.recast_agent_quotas enable row level security;
revoke all on private.recast_agent_quotas from public, anon, authenticated;

create or replace function public.recast_consume_agent_quota()
returns table (allowed boolean, remaining integer, reset_at timestamptz)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_time timestamptz := statement_timestamp();
  current_count integer;
  current_window timestamptz;
begin
  if caller_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  insert into private.recast_agent_quotas as quota (user_id, window_started_at, request_count, updated_at)
  values (caller_id, current_time, 1, current_time)
  on conflict (user_id) do update
  set
    window_started_at = case
      when quota.window_started_at <= current_time - interval '1 minute' then current_time
      else quota.window_started_at
    end,
    request_count = case
      when quota.window_started_at <= current_time - interval '1 minute' then 1
      else least(quota.request_count + 1, 9)
    end,
    updated_at = current_time
  returning quota.request_count, quota.window_started_at
  into current_count, current_window;

  return query select
    current_count <= 8,
    greatest(8 - current_count, 0),
    current_window + interval '1 minute';
end;
$$;

revoke all on function public.recast_consume_agent_quota() from public, anon;
grant execute on function public.recast_consume_agent_quota() to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_workspaces_slug_length'
      and conrelid = 'public.campaign_workspaces'::regclass
  ) then
    alter table public.campaign_workspaces
      add constraint campaign_workspaces_slug_length check (char_length(slug) between 3 and 64);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_workspaces_payload_size'
      and conrelid = 'public.campaign_workspaces'::regclass
  ) then
    alter table public.campaign_workspaces
      add constraint campaign_workspaces_payload_size check (octet_length(payload::text) <= 131072);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_publications_slug_length'
      and conrelid = 'public.campaign_publications'::regclass
  ) then
    alter table public.campaign_publications
      add constraint campaign_publications_slug_length check (char_length(slug) between 3 and 64);
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_publications_payload_contract'
      and conrelid = 'public.campaign_publications'::regclass
  ) then
    alter table public.campaign_publications
      add constraint campaign_publications_payload_contract check (
        octet_length(payload::text) <= 8192
        and payload ?& array['brandName', 'productName', 'headline', 'subheadline', 'cta', 'backgroundColor', 'accentColor', 'proof', 'thesis', 'publishedAt']
        and jsonb_typeof(payload -> 'brandName') = 'string'
        and jsonb_typeof(payload -> 'productName') = 'string'
        and jsonb_typeof(payload -> 'headline') = 'string'
        and jsonb_typeof(payload -> 'subheadline') = 'string'
        and jsonb_typeof(payload -> 'cta') = 'string'
        and jsonb_typeof(payload -> 'backgroundColor') = 'string'
        and jsonb_typeof(payload -> 'accentColor') = 'string'
        and jsonb_typeof(payload -> 'proof') = 'string'
        and jsonb_typeof(payload -> 'thesis') = 'string'
        and jsonb_typeof(payload -> 'publishedAt') = 'string'
        and char_length(btrim(payload ->> 'brandName')) between 1 and 80
        and char_length(btrim(payload ->> 'productName')) between 1 and 120
        and char_length(btrim(payload ->> 'headline')) between 1 and 110
        and char_length(btrim(payload ->> 'subheadline')) between 1 and 100
        and char_length(btrim(payload ->> 'cta')) between 1 and 50
        and char_length(btrim(payload ->> 'proof')) between 1 and 800
        and char_length(btrim(payload ->> 'thesis')) between 1 and 1200
        and (payload ->> 'publishedAt') ~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\.[0-9]+)?(Z|[+-][0-9]{2}:[0-9]{2})$'
        and (payload ->> 'backgroundColor') ~ '^#[0-9a-fA-F]{6}$'
        and (payload ->> 'accentColor') ~ '^#[0-9a-fA-F]{6}$'
        and (
          not (payload ? 'imageUrl')
          or (
            jsonb_typeof(payload -> 'imageUrl') = 'string'
            and (payload ->> 'imageUrl') ~ '^/assets/[A-Za-z0-9][A-Za-z0-9._/-]*$'
            and position('..' in (payload ->> 'imageUrl')) = 0
          )
        )
      );
  end if;
end;
$$;
