-- ============================================================
-- Xeque Mate · 0001 · login, perfis, permissões e agenda do estúdio
-- Rode este arquivo inteiro no Supabase › SQL Editor (uma vez só).
-- ============================================================

-- ---------- tipos ----------
create type public.user_role as enum ('admin', 'staff', 'artist');
create type public.booking_status as enum ('pendente', 'confirmado', 'cancelado');

-- ---------- perfis (um por usuário do login) ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  role        public.user_role not null default 'artist',
  active      boolean not null default true,
  name        text not null default '',
  stage_name  text not null default '',
  title       text not null default '',          -- função da equipe (ex.: Técnico de som)
  color       text not null default '#6fcf9f',
  bio         text not null default '',
  city        text not null default '',
  genres      text[] not null default '{}',
  instagram   text not null default '',
  spotify     text not null default '',
  youtube     text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  constraint color_hex check (color ~ '^#[0-9a-fA-F]{6}$')
);

-- ---------- configurações do estúdio (uma linha só) ----------
create table public.settings (
  id           boolean primary key default true check (id),
  studio_name  text not null default 'Xeque Mate Studio',
  open_hour    int not null default 9  check (open_hour between 0 and 23),
  close_hour   int not null default 23 check (close_hour between 1 and 24),
  check (close_hour > open_hour)
);
insert into public.settings default values;

-- ---------- serviços e preço por hora ----------
create table public.services (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  price_per_hour  numeric(10,2) not null check (price_per_hour >= 0),
  active          boolean not null default true,
  sort            int not null default 0
);
insert into public.services (name, price_per_hour, sort) values
  ('Gravação', 150, 1), ('Mixagem', 180, 2), ('Masterização', 220, 3), ('Ensaio', 80, 4);

-- ---------- sessões no estúdio ----------
create table public.bookings (
  id            uuid primary key default gen_random_uuid(),
  artist_id     uuid not null references public.profiles (id) on delete cascade,
  service_id    uuid references public.services (id) on delete set null,
  service_name  text not null default '',
  date          date not null,
  start_hour    int not null check (start_hour between 0 and 23),
  duration      int not null check (duration between 1 and 16),
  status        public.booking_status not null default 'pendente',
  price         numeric(10,2) not null default 0,
  note          text not null default '',
  engineer_id   uuid references public.profiles (id) on delete set null,
  created_by    uuid default auth.uid(),
  created_at    timestamptz not null default now(),
  check (start_hour + duration <= 24)
);
create index bookings_date_idx on public.bookings (date);
create index bookings_artist_idx on public.bookings (artist_id);

-- ============================================================
-- Funções de permissão
-- ============================================================
create or replace function public.my_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and active
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() = 'admin', false)
$$;

create or replace function public.is_team()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.my_role() in ('admin', 'staff'), false)
$$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

-- Data de hoje no horário de Brasília
create or replace function public.today_sp()
returns date language sql stable as $$
  select (now() at time zone 'America/Sao_Paulo')::date
$$;

-- ============================================================
-- Novo usuário → cria o perfil. O primeiro usuário vira admin.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  base_name text := split_part(new.email, '@', 1);
begin
  select not exists (select 1 from public.profiles) into is_first;
  insert into public.profiles (id, email, name, stage_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), base_name),
    coalesce(nullif(new.raw_user_meta_data ->> 'stage_name', ''), nullif(new.raw_user_meta_data ->> 'name', ''), base_name),
    case when is_first then 'admin'::public.user_role else 'artist'::public.user_role end
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.handle_user_email_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function public.handle_user_email_change();

-- ============================================================
-- Proteção do perfil: só o admin muda tipo de acesso e bloqueio
-- ============================================================
create or replace function public.profiles_guard()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is null then          -- painel do Supabase / chave secreta do servidor
    return new;
  end if;
  if new.id is distinct from old.id or new.email is distinct from old.email then
    raise exception 'Esse campo não pode ser alterado aqui.' using errcode = '42501';
  end if;
  if not public.is_admin() then
    if new.role is distinct from old.role or new.active is distinct from old.active then
      raise exception 'Só o admin pode mudar o tipo de acesso.' using errcode = '42501';
    end if;
  elsif old.id = auth.uid() and (new.role <> 'admin' or not new.active) then
    raise exception 'Você não pode tirar o seu próprio acesso de admin.' using errcode = '42501';
  end if;
  return new;
end $$;

create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.profiles_guard();

-- ============================================================
-- Regras da agenda: preço, horário de funcionamento e conflito
-- ============================================================
create or replace function public.bookings_before()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  cfg     public.settings;
  svc     public.services;
  clash   public.bookings;
  server  boolean := auth.uid() is null;          -- painel do Supabase / servidor
  team    boolean := server or public.is_team();
begin
  if not server and not public.is_active() then
    raise exception 'Sua conta está desativada. Fale com o estúdio.' using errcode = '42501';
  end if;

  -- Artista só pode cancelar a própria sessão, e só se ainda não passou
  if tg_op = 'UPDATE' and not team then
    if new.status <> 'cancelado'
       or (new.artist_id, new.service_id, new.date, new.start_hour, new.duration, new.note, new.engineer_id, new.price)
          is distinct from
          (old.artist_id, old.service_id, old.date, old.start_hour, old.duration, old.note, old.engineer_id, old.price) then
      raise exception 'Você só pode cancelar a sua sessão.' using errcode = '42501';
    end if;
    if old.date < public.today_sp() then
      raise exception 'Sessões que já passaram não podem ser canceladas.' using errcode = '42501';
    end if;
    return new;
  end if;

  if tg_op = 'UPDATE' and new.status = 'cancelado' then
    return new;
  end if;

  select * into svc from public.services where id = new.service_id;
  if not found then
    raise exception 'Escolha um serviço.' using errcode = '23514';
  end if;

  -- Preço sempre calculado aqui, nunca vem do navegador
  if tg_op = 'INSERT'
     or new.service_id is distinct from old.service_id
     or new.duration is distinct from old.duration then
    new.service_name := svc.name;
    new.price := svc.price_per_hour * new.duration;
  end if;

  if not team then
    new.artist_id   := auth.uid();
    new.status      := 'pendente';
    new.engineer_id := null;
    new.created_by  := auth.uid();
    if not svc.active then
      raise exception 'Esse serviço não está disponível no momento.' using errcode = '23514';
    end if;
    if new.date < public.today_sp() then
      raise exception 'Escolha uma data a partir de hoje.' using errcode = '23514';
    end if;
  end if;

  select * into cfg from public.settings where id;
  if new.start_hour < cfg.open_hour or new.start_hour + new.duration > cfg.close_hour then
    raise exception 'O estúdio funciona das %h às %h. Ajuste o início ou a duração.', cfg.open_hour, cfg.close_hour
      using errcode = '23514';
  end if;

  if new.engineer_id is not null
     and not exists (select 1 from public.profiles where id = new.engineer_id and role in ('admin', 'staff')) then
    raise exception 'Escolha alguém da equipe como técnico.' using errcode = '23514';
  end if;

  -- Evita dois pedidos simultâneos no mesmo dia passarem juntos
  perform pg_advisory_xact_lock(hashtext('booking-' || new.date::text));

  select * into clash from public.bookings b
   where b.date = new.date
     and b.status <> 'cancelado'
     and b.id <> new.id
     and b.start_hour < new.start_hour + new.duration
     and new.start_hour < b.start_hour + b.duration
   limit 1;
  if found then
    raise exception 'O estúdio já está ocupado das %:00 às %:00 nesse dia.',
      lpad(clash.start_hour::text, 2, '0'), lpad((clash.start_hour + clash.duration)::text, 2, '0')
      using errcode = '23P01';
  end if;

  return new;
end $$;

create trigger bookings_before
  before insert or update on public.bookings
  for each row execute function public.bookings_before();

-- Horários ocupados da semana, sem revelar de quem são (para a agenda do artista)
create or replace function public.studio_busy(d_from date, d_to date)
returns table (id uuid, date date, start_hour int, duration int, mine boolean)
language sql stable security definer set search_path = public as $$
  select b.id, b.date, b.start_hour, b.duration, b.artist_id = auth.uid()
    from public.bookings b
   where public.is_active()
     and b.status <> 'cancelado'
     and b.date between d_from and d_to
$$;

revoke execute on function public.studio_busy(date, date) from public, anon;
grant execute on function public.studio_busy(date, date) to authenticated;

-- ============================================================
-- Permissões (Row Level Security)
-- ============================================================
alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.services enable row level security;
alter table public.bookings enable row level security;

-- Perfis: cada um vê o seu; a equipe vê todos; artistas veem quem é da equipe
create policy "perfis: ver" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_team() or (role in ('admin', 'staff') and public.is_active()));
create policy "perfis: editar o próprio ou admin" on public.profiles for update to authenticated
  using ((id = auth.uid() and public.is_active()) or public.is_admin())
  with check ((id = auth.uid() and public.is_active()) or public.is_admin());

-- Configurações e serviços: todos logados leem, só o admin muda
create policy "config: ler" on public.settings for select to authenticated using (true);
create policy "config: admin muda" on public.settings for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "serviços: ler" on public.services for select to authenticated using (true);
create policy "serviços: admin cria" on public.services for insert to authenticated with check (public.is_admin());
create policy "serviços: admin muda" on public.services for update to authenticated
  using (public.is_admin()) with check (public.is_admin());
create policy "serviços: admin apaga" on public.services for delete to authenticated using (public.is_admin());

-- Sessões: artista vê e pede as suas; equipe vê e gerencia todas; só admin apaga
create policy "sessões: ver" on public.bookings for select to authenticated
  using (public.is_team() or (artist_id = auth.uid() and public.is_active()));
create policy "sessões: criar" on public.bookings for insert to authenticated
  with check (public.is_team() or (artist_id = auth.uid() and public.is_active()));
create policy "sessões: alterar" on public.bookings for update to authenticated
  using (public.is_team() or (artist_id = auth.uid() and public.is_active()))
  with check (public.is_team() or (artist_id = auth.uid() and public.is_active()));
create policy "sessões: apagar" on public.bookings for delete to authenticated
  using (public.is_admin());

-- ============================================================
-- Fotos de perfil (Storage)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "fotos: enviar a própria" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text and public.is_active());
create policy "fotos: trocar a própria" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "fotos: apagar a própria" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
