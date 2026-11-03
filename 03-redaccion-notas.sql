-- ============================================================
-- SUBE — Panel de Redacción (/redaccion)
-- ------------------------------------------------------------
-- Se corre UNA vez en Supabase → SQL Editor → New query → pegar todo → Run.
-- Se puede volver a correr sin problema: no borra notas ni datos.
--
-- Requiere haber corrido antes 01-estructura.sql (usa las tablas
-- "equipo" y "redaccion" y las funciones es_equipo() y es_redaccion()).
--
-- Qué guarda:
--   La tabla "notas" es la mesa de trabajo del panel: borradores y la
--   versión de cada nota. Los borradores son privados: solo los ve la
--   redacción. Al tocar «Publicar», la función "redaccion" (Edge Function)
--   escribe la nota en GitHub (carpeta redaccion/) y la web se actualiza sola.
-- ============================================================

create table if not exists public.notas (
  id                  uuid primary key default gen_random_uuid(),
  archivo             text unique,                 -- redaccion/AAAA-MM-DD-titulo.md (vacío si nunca se publicó)
  sha                 text,                        -- versión del archivo en GitHub
  titulo              text not null default '',
  seccion             text not null default 'Actualidad',
  fecha               date not null default public.hoy_ar(),
  bajada              text not null default '',
  autor               text not null default '',
  imagen              text not null default '',
  epigrafe            text not null default '',
  video               text not null default '',
  portada             text not null default 'Foto' check (portada in ('Foto', 'Video')),
  jerarquia           text not null default 'Normal' check (jerarquia in ('Principal', 'Destacada', 'Normal')),
  visible             boolean not null default true,
  cuerpo              text not null default '',
  estado              text not null default 'borrador' check (estado in ('borrador', 'publicada', 'fuera')),
  cambios_sin_publicar boolean not null default false,
  creado_por          uuid references auth.users (id) on delete set null,
  creado_por_nombre   text not null default '',
  actualizado_por_nombre text not null default '',
  creado_at           timestamptz not null default now(),
  actualizado_at      timestamptz not null default now(),
  publicado_at        timestamptz
);
create index if not exists notas_fecha_idx on public.notas (fecha desc, actualizado_at desc);

-- ¿Quien ingresó puede usar el panel? (redacción activa o equipo)
create or replace function public.puede_redactar()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.es_redaccion() or public.es_equipo();
$$;

-- Nombre para firmar las notas y los cambios
create or replace function public.mi_nombre_redaccion()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select trim(nombre || ' ' || apellido) from public.redaccion
      where activo and (user_id = auth.uid() or mail = public.mail_actual()) limit 1),
    (select nombre from public.equipo where mail = public.mail_actual()),
    '');
$$;

alter table public.notas enable row level security;

drop policy if exists "redaccion ve notas" on public.notas;
create policy "redaccion ve notas" on public.notas
  for select to authenticated using (public.puede_redactar());

drop policy if exists "redaccion crea notas" on public.notas;
create policy "redaccion crea notas" on public.notas
  for insert to authenticated with check (public.puede_redactar());

drop policy if exists "redaccion edita notas" on public.notas;
create policy "redaccion edita notas" on public.notas
  for update to authenticated using (public.puede_redactar()) with check (public.puede_redactar());

-- Borrar: la redacción solo borra borradores que nunca se publicaron;
-- las notas publicadas las borra el equipo (o se sacan de la web con «Visible»).
drop policy if exists "borrar notas" on public.notas;
create policy "borrar notas" on public.notas
  for delete to authenticated using (public.es_equipo() or (public.puede_redactar() and archivo is null));

revoke all on function public.puede_redactar(), public.mi_nombre_redaccion() from public, anon;
grant execute on function public.puede_redactar(), public.mi_nombre_redaccion() to authenticated;
grant select, insert, update, delete on public.notas to authenticated;
revoke all on public.notas from anon;

-- El acceso del portal de trabajo pasa del panel viejo (admin/) al nuevo.
update public.portal_enlaces
   set url = 'redaccion/',
       descripcion = 'Panel de redacción: escribí, guardá y publicá notas. Entrás con tu usuario de SUBE.'
 where url in ('admin/', 'admin/index.html');
