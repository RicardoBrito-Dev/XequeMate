-- Etapa 2: agenda pessoal dos artistas (shows, ensaios, entrevistas, viagens...)
-- Rode uma vez no SQL Editor do Supabase, depois da 0001.

create table public.events (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.profiles(id) on delete cascade,
  date date not null,
  kind text not null default 'Show' check (kind in ('Show','Ensaio','Entrevista','Lançamento','Viagem','Outro')),
  title text not null check (char_length(title) between 1 and 120),
  time time,
  place text not null default '' check (char_length(place) <= 120),
  city text not null default '' check (char_length(city) <= 80),
  fee numeric(10,2) check (fee is null or fee >= 0),
  status text not null default 'confirmado' check (status in ('confirmado','a confirmar')),
  notes text not null default '' check (char_length(notes) <= 300),
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index events_artist_date_idx on public.events (artist_id, date);
create index events_date_idx on public.events (date);

alter table public.events enable row level security;

-- Artista vê e mexe só nos próprios compromissos. Admin e equipe veem e mexem em todos.
create policy "agenda: ver" on public.events for select to authenticated
  using (public.is_active() and (public.is_team() or artist_id = auth.uid()));

create policy "agenda: criar" on public.events for insert to authenticated
  with check (public.is_active() and (public.is_team() or artist_id = auth.uid()));

create policy "agenda: alterar" on public.events for update to authenticated
  using (public.is_active() and (public.is_team() or artist_id = auth.uid()))
  with check (public.is_active() and (public.is_team() or artist_id = auth.uid()));

create policy "agenda: apagar" on public.events for delete to authenticated
  using (public.is_active() and (public.is_team() or artist_id = auth.uid()));

-- Só admin/equipe podem trocar o dono de um compromisso, e o dono precisa ser artista
create or replace function public.events_guard()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'UPDATE' and new.artist_id <> old.artist_id and not public.is_team() then
    raise exception 'Você não pode mudar o dono do compromisso.' using errcode = '23514';
  end if;
  if not exists (select 1 from public.profiles where id = new.artist_id and role = 'artist') then
    raise exception 'O compromisso precisa ser de um artista.' using errcode = '23514';
  end if;
  if tg_op = 'INSERT' then new.created_by := auth.uid(); end if;
  return new;
end $$;

create trigger events_guard before insert or update on public.events
  for each row execute function public.events_guard();
