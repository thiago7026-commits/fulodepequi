-- Ative RLS e permita acesso somente para usuários com role = 'alfa'.
-- Ajuste os nomes das tabelas conforme seu schema.

-- Reservas
alter table public.reservas enable row level security;
create policy "alfa full access reservas"
  on public.reservas
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa');

-- Bloqueios
alter table public.bloqueios enable row level security;
create policy "alfa full access bloqueios"
  on public.bloqueios
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa');

-- Configurações
alter table public.config enable row level security;
create policy "alfa full access config"
  on public.config
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa');

-- Fotos (home)
alter table public.fotos_home enable row level security;
create policy "alfa full access fotos_home"
  on public.fotos_home
  for all
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa')
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'alfa');

-- Opcional: permitir que o próprio usuário leia o role em public.profiles
-- (se você usar uma tabela de profiles ao invés de app_metadata)
-- alter table public.profiles enable row level security;
-- create policy "read own profile"
--   on public.profiles
--   for select
--   using (auth.uid() = id);
