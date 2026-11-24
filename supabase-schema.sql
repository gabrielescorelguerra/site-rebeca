create table if not exists public.planning_config (
  id text primary key,
  config jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.planning_config enable row level security;

create policy "public can read planning"
  on public.planning_config
  for select
  to anon, authenticated
  using (true);

create policy "public can write planning"
  on public.planning_config
  for insert
  to anon, authenticated
  with check (true);

create policy "public can update planning"
  on public.planning_config
  for update
  to anon, authenticated
  using (true)
  with check (true);

insert into public.planning_config (id, config)
values ('main', '{}'::jsonb)
on conflict (id) do nothing;

-- Imagens do editor (fundo e blocos de imagem). Execute no SQL Editor do Supabase.
-- Atenção: como o restante do projeto, a escrita é pública enquanto não houver autenticação real.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('call-media', 'call-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do nothing;

create policy "public can read call media"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'call-media');

create policy "public can upload call media"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'call-media');

-- Respostas da Rebeca aos elementos interativos dos convites (confirmação, votação, perguntas, checklist, quiz).
-- Uma linha por bloco e por call (call_key = eventId da call). Escrita pública, como o resto do projeto.
create table if not exists public.call_responses (
  call_key text not null,
  block_id text not null,
  value jsonb not null check (octet_length(value::text) <= 4000),
  updated_at timestamptz not null default now(),
  primary key (call_key, block_id)
);

alter table public.call_responses enable row level security;

create policy "public can read responses" on public.call_responses for select to anon, authenticated using (true);
create policy "public can insert responses" on public.call_responses for insert to anon, authenticated with check (true);
create policy "public can update responses" on public.call_responses for update to anon, authenticated using (true) with check (true);
create policy "public can delete responses" on public.call_responses for delete to anon, authenticated using (true);

-- Nossa lista (bucket list do casal). Uma linha por ideia, para duas pessoas editarem sem conflito.
-- Escrita pública como no resto do projeto (a autenticação atual é demonstrativa).
create table if not exists public.bucket_items (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 140),
  note text not null default '' check (char_length(note) <= 600),
  category text not null default 'bobagem' check (category in ('sonho', 'bobagem', 'comida', 'lugar', 'romantico', 'jogo')),
  level smallint not null default 2 check (level between 1 and 5),
  author text not null check (author in ('admin', 'user')),
  done boolean not null default false,
  done_at timestamptz,
  memory text not null default '' check (char_length(memory) <= 1000),
  photos jsonb not null default '[]'::jsonb check (jsonb_typeof(photos) = 'array' and jsonb_array_length(photos) <= 4),
  created_at timestamptz not null default now()
);

alter table public.bucket_items enable row level security;

create policy "public can read bucket" on public.bucket_items for select to anon, authenticated using (true);
create policy "public can insert bucket" on public.bucket_items for insert to anon, authenticated with check (true);
create policy "public can update bucket" on public.bucket_items for update to anon, authenticated using (true) with check (true);
create policy "public can delete bucket" on public.bucket_items for delete to anon, authenticated using (true);
