-- Public campaign records may contain only the fields consumed by the public
-- renderer. This prevents an authenticated publisher from accidentally
-- exposing private workspace metadata through the anonymous read policy.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'campaign_publications_payload_keys'
      and conrelid = 'public.campaign_publications'::regclass
  ) then
    alter table public.campaign_publications
      add constraint campaign_publications_payload_keys check (
        (
          payload - array[
            'brandName',
            'productName',
            'headline',
            'subheadline',
            'cta',
            'imageUrl',
            'backgroundColor',
            'accentColor',
            'proof',
            'thesis',
            'publishedAt'
          ]
        ) = '{}'::jsonb
      );
  end if;
end;
$$;
