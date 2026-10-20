-- MOSAIC cloud-storage schema. Review before applying; this migration does not copy localStorage data.
-- Intentionally fails if a table already has one of these names, so existing tables are never altered.
begin;

create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  interest_id text check (interest_id in ('basketball', 'ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom')),
  custom_topic text not null default '' check (char_length(custom_topic) <= 48),
  -- Null follows the selected interest; an explicit companion choice stores its avatar ID.
  avatar_id text check (char_length(avatar_id) <= 64),
  -- Store UserPreferences fields other than interest and customTopic here when cloud sync is added.
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  current_lesson_id text not null default 'hello-python' check (current_lesson_id in (
    'hello-python', 'variables', 'conditions', 'loops', 'functions', 'lists',
    'strings', 'dictionaries', 'user-input', 'numbers', 'combining-concepts', 'final-project'
  )),
  difficulty_override text check (difficulty_override in ('guided', 'independent', 'challenge')),
  last_completed_exercise_id text check (char_length(last_completed_exercise_id) < 600),
  project_snapshots jsonb not null default '{}'::jsonb check (jsonb_typeof(project_snapshots) = 'object'),
  progress_format_version smallint not null default 1 check (progress_format_version = 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  -- Stable ConceptId values; independent of the selected interest or theme.
  concept_id text not null check (concept_id in (
    'hello-python', 'variables', 'conditions', 'loops', 'functions', 'lists',
    'strings', 'dictionaries', 'user-input', 'numbers', 'combining-concepts', 'final-project'
  )),
  completed boolean not null default false,
  -- Keep exact exercise IDs, including journey-v1 and legacy/custom variants.
  completed_exercise_ids text[] not null default '{}'::text[] check (cardinality(completed_exercise_ids) <= 1000),
  -- Original AttemptRecord[] and HintRecord[] retain timestamps, errors, difficulty and hint levels.
  attempts jsonb not null default '[]'::jsonb check (jsonb_typeof(attempts) = 'array' and jsonb_array_length(attempts) <= 500),
  hints jsonb not null default '[]'::jsonb check (jsonb_typeof(hints) = 'array' and jsonb_array_length(hints) <= 1000),
  time_spent_ms bigint not null default 0 check (time_spent_ms >= 0),
  -- Null means no defensible estimate yet (for example a legacy completion with no attempt history).
  mastery_score smallint check (mastery_score between 0 and 100),
  mastery_model_version smallint check (mastery_model_version = 1),
  updated_at timestamptz not null default now(),
  constraint lesson_progress_mastery_version_pair check (
    (mastery_score is null and mastery_model_version is null) or
    (mastery_score is not null and mastery_model_version is not null)
  ),
  primary key (user_id, concept_id)
);

create table public.code_saves (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  -- The draft key is the existing exerciseId, or a legacy concept-only key.
  draft_key text not null check (char_length(draft_key) < 600),
  concept_id text check (concept_id in (
    'hello-python', 'variables', 'conditions', 'loops', 'functions', 'lists',
    'strings', 'dictionaries', 'user-input', 'numbers', 'combining-concepts', 'final-project'
  )),
  interest_id text check (interest_id in ('basketball', 'ocean', 'space', 'trains', 'animals', 'music', 'sports', 'custom')),
  -- Nullable fields preserve drafts containing only queued input or only Python code.
  code text check (char_length(code) <= 100000),
  input_draft text check (char_length(input_draft) <= 100000),
  updated_at timestamptz not null default now(),
  constraint code_saves_has_content check (code is not null or input_draft is not null),
  constraint code_saves_one_draft_per_user unique (user_id, draft_key)
);

create index code_saves_user_id_idx on public.code_saves (user_id);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.code_saves enable row level security;

-- Supabase projects may have default public-schema grants. Remove them for these tables.
revoke all on table public.profiles, public.lesson_progress, public.code_saves from public, anon, authenticated;
grant select, insert, update, delete on table public.profiles, public.lesson_progress, public.code_saves to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy profiles_delete_own on public.profiles for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy lesson_progress_select_own on public.lesson_progress for select to authenticated
  using ((select auth.uid()) = user_id);
create policy lesson_progress_insert_own on public.lesson_progress for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy lesson_progress_update_own on public.lesson_progress for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy lesson_progress_delete_own on public.lesson_progress for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy code_saves_select_own on public.code_saves for select to authenticated
  using ((select auth.uid()) = user_id);
create policy code_saves_insert_own on public.code_saves for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy code_saves_update_own on public.code_saves for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy code_saves_delete_own on public.code_saves for delete to authenticated
  using ((select auth.uid()) = user_id);

commit;
