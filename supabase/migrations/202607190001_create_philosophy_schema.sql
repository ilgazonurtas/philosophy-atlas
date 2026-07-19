create extension if not exists pgcrypto;

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  url text not null unique,
  publisher text,
  language_code text check (language_code is null or language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  retrieved_at timestamptz,
  source_type text not null default 'web',
  license text,
  citation text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  wikidata_id text unique check (wikidata_id is null or wikidata_id ~ '^Q[0-9]+$'),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  coordinate_precision double precision check (coordinate_precision is null or coordinate_precision >= 0),
  coordinate_globe text,
  coordinate_source_id uuid references public.sources(id) on delete set null,
  coordinate_confidence numeric(4, 3) check (coordinate_confidence is null or coordinate_confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.place_translations (
  place_id uuid not null references public.places(id) on delete cascade,
  language_code text not null check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name text not null,
  source_id uuid references public.sources(id) on delete set null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (place_id, language_code)
);

create table public.philosophers (
  id uuid primary key default gen_random_uuid(),
  wikidata_id text not null unique check (wikidata_id ~ '^Q[0-9]+$'),
  birth_year integer,
  birth_month smallint check (birth_month is null or birth_month between 1 and 12),
  birth_day smallint check (birth_day is null or birth_day between 1 and 31),
  birth_precision smallint,
  birth_source_id uuid references public.sources(id) on delete set null,
  birth_confidence numeric(4, 3) check (birth_confidence is null or birth_confidence between 0 and 1),
  death_year integer,
  death_month smallint check (death_month is null or death_month between 1 and 12),
  death_day smallint check (death_day is null or death_day between 1 and 31),
  death_precision smallint,
  death_source_id uuid references public.sources(id) on delete set null,
  death_confidence numeric(4, 3) check (death_confidence is null or death_confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.philosopher_translations (
  philosopher_id uuid not null references public.philosophers(id) on delete cascade,
  language_code text not null check (language_code ~ '^[a-z]{2,3}(-[A-Z]{2})?$'),
  name text not null,
  summary text,
  wikidata_description text,
  source_summary text,
  source_summary_url text,
  source_summary_retrieved_at timestamptz,
  source_summary_language text check (
    source_summary_language is null or source_summary_language ~ '^[a-z]{2,3}(-[A-Z]{2})?$'
  ),
  wikipedia_title text,
  school_labels text[] not null default '{}',
  source_id uuid references public.sources(id) on delete set null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (philosopher_id, language_code),
  check (
    (source_summary is null and source_summary_url is null and source_summary_retrieved_at is null and source_summary_language is null)
    or
    (source_summary is not null and source_summary_url is not null and source_summary_retrieved_at is not null and source_summary_language is not null)
  )
);

create table public.philosopher_locations (
  id uuid primary key default gen_random_uuid(),
  philosopher_id uuid not null references public.philosophers(id) on delete cascade,
  place_id uuid not null references public.places(id) on delete cascade,
  relationship text not null,
  start_year integer,
  end_year integer,
  source_id uuid references public.sources(id) on delete set null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (philosopher_id, place_id, relationship)
);

create table public.influences (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references public.philosophers(id) on delete cascade,
  influenced_id uuid not null references public.philosophers(id) on delete cascade,
  source_id uuid references public.sources(id) on delete set null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (influencer_id <> influenced_id),
  unique (influencer_id, influenced_id, source_id)
);

create table public.images (
  id uuid primary key default gen_random_uuid(),
  philosopher_id uuid not null references public.philosophers(id) on delete cascade,
  commons_filename text,
  original_url text,
  thumbnail_url text,
  description_url text,
  creator text,
  credit text,
  license text,
  license_url text,
  source_id uuid references public.sources(id) on delete set null,
  confidence numeric(4, 3) check (confidence is null or confidence between 0 and 1),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (original_url is not null or thumbnail_url is not null)
);

create unique index images_one_primary_per_philosopher
  on public.images (philosopher_id)
  where is_primary;
create index philosopher_locations_philosopher_idx on public.philosopher_locations (philosopher_id);
create index philosopher_locations_place_idx on public.philosopher_locations (place_id);
create index influences_influencer_idx on public.influences (influencer_id);
create index influences_influenced_idx on public.influences (influenced_id);
create index images_philosopher_idx on public.images (philosopher_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sources_set_updated_at before update on public.sources
  for each row execute function public.set_updated_at();
create trigger places_set_updated_at before update on public.places
  for each row execute function public.set_updated_at();
create trigger place_translations_set_updated_at before update on public.place_translations
  for each row execute function public.set_updated_at();
create trigger philosophers_set_updated_at before update on public.philosophers
  for each row execute function public.set_updated_at();
create trigger philosopher_translations_set_updated_at before update on public.philosopher_translations
  for each row execute function public.set_updated_at();
create trigger philosopher_locations_set_updated_at before update on public.philosopher_locations
  for each row execute function public.set_updated_at();
create trigger influences_set_updated_at before update on public.influences
  for each row execute function public.set_updated_at();
create trigger images_set_updated_at before update on public.images
  for each row execute function public.set_updated_at();

alter table public.sources enable row level security;
alter table public.places enable row level security;
alter table public.place_translations enable row level security;
alter table public.philosophers enable row level security;
alter table public.philosopher_translations enable row level security;
alter table public.philosopher_locations enable row level security;
alter table public.influences enable row level security;
alter table public.images enable row level security;

create policy "Public sources are readable" on public.sources for select using (true);
create policy "Public places are readable" on public.places for select using (true);
create policy "Public place translations are readable" on public.place_translations for select using (true);
create policy "Public philosophers are readable" on public.philosophers for select using (true);
create policy "Public philosopher translations are readable" on public.philosopher_translations for select using (true);
create policy "Public philosopher locations are readable" on public.philosopher_locations for select using (true);
create policy "Public influences are readable" on public.influences for select using (true);
create policy "Public images are readable" on public.images for select using (true);

grant select on public.sources, public.places, public.place_translations, public.philosophers,
  public.philosopher_translations, public.philosopher_locations, public.influences, public.images
  to anon, authenticated;
