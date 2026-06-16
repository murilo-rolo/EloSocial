-- Migration 00003: Videoconferência com Daily.co

create table video_rooms (
  id uuid primary key default gen_random_uuid(),
  room_name text unique not null,
  room_url text not null,
  created_by uuid references profiles(id) not null,
  privacy text not null default 'public' check (privacy in ('public', 'private')),
  access_code text,
  expires_at bigint,
  created_at timestamptz default now()
);

create table video_participants (
  id uuid primary key default gen_random_uuid(),
  room_id uuid references video_rooms(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  joined_at timestamptz default now(),
  unique(room_id, user_id)
);

alter table video_rooms enable row level security;
alter table video_participants enable row level security;

-- video_rooms: select se criador ou participante
create policy "video_rooms_select"
  on video_rooms for select
  using (
    created_by = auth.uid()
    or id in (
      select room_id from video_participants where user_id = auth.uid()
    )
  );

-- video_rooms: insert como criador
create policy "video_rooms_insert"
  on video_rooms for insert
  with check (created_by = auth.uid());

-- video_rooms: update só criador (para encerrar sala)
create policy "video_rooms_update"
  on video_rooms for update
  using (created_by = auth.uid());

-- video_participants: select próprio
create policy "video_participants_select"
  on video_participants for select
  using (user_id = auth.uid());

-- video_participants: insert próprio
create policy "video_participants_insert"
  on video_participants for insert
  with check (user_id = auth.uid());

-- habilita realtime para notificar novas salas
alter publication supabase_realtime add table video_rooms;
