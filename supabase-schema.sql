-- ============================================================
-- FocusFlow — Schéma Supabase
-- À exécuter dans : Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ── Profils ──────────────────────────────────────────────────
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  username    text unique not null,
  avatar_url  text,
  level       int  not null default 1,
  xp          int  not null default 0,
  total_pts   int  not null default 0,
  streak      int  not null default 0,
  last_active date,
  created_at  timestamptz not null default now()
);

-- Créé automatiquement à l'inscription
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── Sessions ─────────────────────────────────────────────────
create table sessions (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references profiles on delete cascade,
  subject     text,
  duration    int  not null,   -- secondes effectuées
  completed   bool not null default false,
  pts_earned  int  not null default 0,
  started_at  timestamptz not null default now(),
  ended_at    timestamptz
);

-- ── Tâches ───────────────────────────────────────────────────
create table tasks (
  id          uuid primary key default uuid_generate_v4(),
  session_id  uuid not null references sessions on delete cascade,
  label       text not null,
  done        bool not null default false
);

-- ── Badges ───────────────────────────────────────────────────
create table badges (
  id        uuid primary key default uuid_generate_v4(),
  key       text unique not null,
  label     text not null,
  icon      text not null,
  condition jsonb not null   -- ex: {"type": "streak", "value": 7}
);

create table user_badges (
  user_id   uuid not null references profiles on delete cascade,
  badge_id  uuid not null references badges,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

-- Badges de départ
insert into badges (key, label, icon, condition) values
  ('streak_3',    'Série de 3',    '🔥', '{"type":"streak","value":3}'),
  ('streak_7',    'Série de 7',    '🔥', '{"type":"streak","value":7}'),
  ('sessions_10', '10 sessions',   '⚡', '{"type":"sessions","value":10}'),
  ('sessions_50', '50 sessions',   '🏆', '{"type":"sessions","value":50}'),
  ('night_owl',   'Night Owl',     '🌙', '{"type":"hour","value":23}'),
  ('early_bird',  'Early Bird',    '🌅', '{"type":"hour","value":6}');

-- ── Amitiés ──────────────────────────────────────────────────
create table friendships (
  id        uuid primary key default uuid_generate_v4(),
  requester uuid not null references profiles on delete cascade,
  addressee uuid not null references profiles on delete cascade,
  status    text not null default 'pending' check (status in ('pending','accepted','blocked')),
  created_at timestamptz not null default now(),
  unique (requester, addressee)
);

-- ── Groupes ──────────────────────────────────────────────────
create table groups (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  owner_id    uuid not null references profiles on delete cascade,
  invite_code text unique not null default substr(md5(random()::text), 1, 8),
  created_at  timestamptz not null default now()
);

create table group_members (
  group_id  uuid not null references groups on delete cascade,
  user_id   uuid not null references profiles on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

-- ── Row Level Security ────────────────────────────────────────
alter table profiles      enable row level security;
alter table sessions      enable row level security;
alter table tasks         enable row level security;
alter table user_badges   enable row level security;
alter table friendships   enable row level security;
alter table groups        enable row level security;
alter table group_members enable row level security;

-- Profils : lecture publique, écriture uniquement pour soi
create policy "profiles_select" on profiles for select using (true);
create policy "profiles_update" on profiles for update using (auth.uid() = id);

-- Sessions : uniquement les siennes
create policy "sessions_all"   on sessions for all using (auth.uid() = user_id);

-- Tâches : via la session
create policy "tasks_all" on tasks for all
  using (session_id in (select id from sessions where user_id = auth.uid()));

-- Badges : lecture publique
create policy "user_badges_select" on user_badges for select using (true);
create policy "user_badges_insert" on user_badges for insert with check (auth.uid() = user_id);

-- Amitiés : voir les siennes
create policy "friendships_all" on friendships for all
  using (auth.uid() = requester or auth.uid() = addressee);

-- Groupes : membres seulement
create policy "groups_select" on groups for select
  using (id in (select group_id from group_members where user_id = auth.uid()));
create policy "groups_insert" on groups for insert with check (auth.uid() = owner_id);

create policy "group_members_all" on group_members for all
  using (auth.uid() = user_id);

-- ── Fonction : ajouter des points ────────────────────────────
create or replace function add_points(p_user_id uuid, p_points int)
returns void as $$
declare
  new_xp    int;
  new_level int;
begin
  update profiles
  set
    total_pts = total_pts + p_points,
    xp        = xp + p_points
  where id = p_user_id
  returning xp into new_xp;

  -- Calcul du niveau (simple : 1 niveau tous les 500 XP)
  new_level := floor(new_xp / 500) + 1;
  update profiles set level = new_level where id = p_user_id;
end;
$$ language plpgsql security definer;
