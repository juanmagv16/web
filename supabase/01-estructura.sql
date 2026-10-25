-- ============================================================
-- SUBE — Mi pase: estructura de la base de datos (Supabase)
-- ------------------------------------------------------------
-- Cómo usarlo: en Supabase, abrí "SQL Editor", pegá TODO este
-- archivo y tocá "Run". Se puede volver a correr sin romper nada.
--
-- Qué crea:
--   socios      → la lista que carga finanzas con el Excel mensual
--   comercios   → los comercios adheridos que pueden verificar socios
--   equipo      → las personas de Sube que administran (finanzas, etc.)
--   busquedas   → el registro de cada verificación que hace un comercio
--
-- Quién ve qué (reglas de seguridad, "RLS"):
--   * Cada socio ve SOLO su propia fila.
--   * Cada comercio ve SOLO su propia fila. Para verificar socios usa
--     la función verificar_socio(), que responde activo / no activo y
--     nunca le muestra la lista ni los mails.
--   * El equipo de Sube ve y edita todo.
--   * Nadie que no haya ingresado ve nada.
-- ============================================================

create extension if not exists unaccent with schema extensions;

-- ---------- Utilidades ----------

-- "Juan  Pérez" → "juan perez" (sin tildes, minúsculas, un solo espacio)
create or replace function public.normalizar(t text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(regexp_replace(trim(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(t, ''))), '\s+', ' ', 'g'));
$$;

-- Fecha de hoy en Argentina
create or replace function public.hoy_ar()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date;
$$;

-- ---------- Tablas ----------

create table if not exists public.socios (
  id                    uuid primary key default gen_random_uuid(),
  nombre                text not null,
  apellido              text not null default '',
  mail                  text not null unique check (mail = lower(trim(mail))),
  estado                text not null default 'activo' check (estado in ('activo', 'inactivo')),
  vigente_hasta         date,
  user_id               uuid unique references auth.users (id) on delete set null,
  acepto_privacidad_at  timestamptz,
  creado_at             timestamptz not null default now(),
  actualizado_at        timestamptz not null default now()
);
create index if not exists socios_nombre_idx on public.socios (public.normalizar(nombre || ' ' || apellido));

create table if not exists public.comercios (
  id         uuid primary key default gen_random_uuid(),
  nombre     text not null,
  mail       text not null unique check (mail = lower(trim(mail))),
  activo     boolean not null default true,
  user_id    uuid unique references auth.users (id) on delete set null,
  creado_at  timestamptz not null default now()
);

create table if not exists public.equipo (
  mail       text primary key check (mail = lower(trim(mail))),
  nombre     text not null,
  creado_at  timestamptz not null default now()
);

create table if not exists public.busquedas (
  id           bigint generated always as identity primary key,
  fecha        timestamptz not null default now(),
  comercio_id  uuid references public.comercios (id) on delete set null,
  texto        text not null,
  resultado    text not null check (resultado in ('activo', 'no_activo', 'no_encontrado', 'repetido')),
  socio_id     uuid references public.socios (id) on delete set null
);
create index if not exists busquedas_fecha_idx on public.busquedas (fecha desc);

-- ---------- ¿Quién es quien ingresó? ----------

create or replace function public.mail_actual()
returns text
language sql
stable
set search_path = ''
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.equipo where mail = public.mail_actual());
$$;

-- ---------- Reglas de acceso (RLS) ----------

alter table public.socios    enable row level security;
alter table public.comercios enable row level security;
alter table public.equipo    enable row level security;
alter table public.busquedas enable row level security;

drop policy if exists "socio ve su fila" on public.socios;
create policy "socio ve su fila" on public.socios
  for select to authenticated using (user_id = auth.uid() or public.es_equipo());
drop policy if exists "equipo edita socios" on public.socios;
create policy "equipo edita socios" on public.socios
  for all to authenticated using (public.es_equipo()) with check (public.es_equipo());

drop policy if exists "comercio ve su fila" on public.comercios;
create policy "comercio ve su fila" on public.comercios
  for select to authenticated using (user_id = auth.uid() or public.es_equipo());
drop policy if exists "equipo edita comercios" on public.comercios;
create policy "equipo edita comercios" on public.comercios
  for all to authenticated using (public.es_equipo()) with check (public.es_equipo());

drop policy if exists "equipo ve equipo" on public.equipo;
create policy "equipo ve equipo" on public.equipo
  for select to authenticated using (public.es_equipo());

drop policy if exists "equipo ve busquedas" on public.busquedas;
create policy "equipo ve busquedas" on public.busquedas
  for select to authenticated using (public.es_equipo());

-- ---------- Funciones que usa la página ----------

-- Qué tipo de cuenta tiene quien ingresó: 'equipo', 'comercio',
-- 'comercio_baja', 'socio' o null. La primera vez, vincula la cuenta
-- con su fila por el mail.
create or replace function public.mi_rol()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := public.mail_actual();
  c public.comercios;
begin
  if auth.uid() is null then return null; end if;
  if exists (select 1 from public.equipo where mail = correo) then return 'equipo'; end if;

  select * into c from public.comercios where user_id = auth.uid() or (mail = correo and user_id is null) limit 1;
  if found then
    if c.user_id is null then update public.comercios set user_id = auth.uid() where id = c.id; end if;
    return case when c.activo then 'comercio' else 'comercio_baja' end;
  end if;

  update public.socios set user_id = auth.uid() where mail = correo and user_id is null;
  if exists (select 1 from public.socios where user_id = auth.uid()) then return 'socio'; end if;
  return null;
end;
$$;

-- Datos del boleto del socio que ingresó.
create or replace function public.mi_pase()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.socios;
begin
  if auth.uid() is null then raise exception 'Tenés que ingresar.'; end if;
  perform public.mi_rol();
  select * into s from public.socios where user_id = auth.uid();
  if not found then return null; end if;
  return jsonb_build_object(
    'nombre', s.nombre,
    'apellido', s.apellido,
    'mail', s.mail,
    'al_dia', s.estado = 'activo' and (s.vigente_hasta is null or s.vigente_hasta >= public.hoy_ar()),
    'vigente_hasta', s.vigente_hasta,
    'acepto_privacidad', s.acepto_privacidad_at is not null
  );
end;
$$;

-- El socio acepta el aviso de privacidad (al activar su cuenta).
create or replace function public.aceptar_privacidad()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.socios set acepto_privacidad_at = coalesce(acepto_privacidad_at, now()) where user_id = auth.uid();
$$;

-- Buscador de los comercios: responde 'activo', 'no_activo' o 'repetido'
-- y deja anotada la búsqueda. Nunca devuelve datos del socio.
create or replace function public.verificar_socio(texto text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  c public.comercios;
  q text := public.normalizar(texto);
  n int;
  s public.socios;
  r text;
begin
  perform public.mi_rol();
  select * into c from public.comercios where user_id = auth.uid() and activo;
  if not found then raise exception 'Tu cuenta de comercio no está habilitada.'; end if;
  if q !~ '\S+ \S+' then raise exception 'Escribí nombre y apellido.'; end if;

  select count(*) into n from public.socios where public.normalizar(nombre || ' ' || apellido) = q;
  if n = 0 then
    r := 'no_encontrado';
  elsif n > 1 then
    r := 'repetido';
  else
    select * into s from public.socios where public.normalizar(nombre || ' ' || apellido) = q;
    r := case when s.estado = 'activo' and (s.vigente_hasta is null or s.vigente_hasta >= public.hoy_ar())
              then 'activo' else 'no_activo' end;
  end if;

  insert into public.busquedas (comercio_id, texto, resultado, socio_id)
  values (c.id, left(trim(texto), 120), r, s.id);

  return case when r = 'no_encontrado' then 'no_activo' else r end;
end;
$$;

-- Carga mensual del Excel (solo equipo). Recibe una lista de filas
-- [{nombre, apellido, mail, estado, vigente_hasta}, ...]. El Excel es la
-- lista completa del mes: quien no figura pasa a 'inactivo'.
-- Con aplicar = false solo calcula el resumen, sin guardar nada.
create or replace function public.importar_socios(filas jsonb, aplicar boolean default false)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  f jsonb;
  correo text;
  previo public.socios;
  nuevo_estado text;
  vistos text[] := '{}';
  nuevos int := 0; siguen int := 0; reactivados int := 0; bajas int := 0; ausentes int := 0;
begin
  if not public.es_equipo() then raise exception 'Solo el equipo de Sube puede cargar socios.'; end if;

  for f in select * from jsonb_array_elements(filas) loop
    correo := lower(trim(f ->> 'mail'));
    if correo is null or correo !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' or correo = any (vistos) then continue; end if;
    vistos := vistos || correo;
    nuevo_estado := case when f ->> 'estado' = 'inactivo' then 'inactivo' else 'activo' end;

    select * into previo from public.socios where mail = correo;
    if not found then nuevos := nuevos + 1;
    elsif nuevo_estado = 'activo' and previo.estado = 'activo' then siguen := siguen + 1;
    elsif nuevo_estado = 'activo' then reactivados := reactivados + 1;
    elsif previo.estado = 'activo' then bajas := bajas + 1;
    end if;

    if aplicar then
      insert into public.socios (nombre, apellido, mail, estado, vigente_hasta)
      values (coalesce(nullif(trim(f ->> 'nombre'), ''), correo), coalesce(trim(f ->> 'apellido'), ''), correo,
              nuevo_estado, nullif(f ->> 'vigente_hasta', '')::date)
      on conflict (mail) do update set
        nombre = excluded.nombre, apellido = excluded.apellido, estado = excluded.estado,
        vigente_hasta = excluded.vigente_hasta, actualizado_at = now();
    end if;
  end loop;

  select count(*) into ausentes from public.socios where estado = 'activo' and not (mail = any (vistos));
  if aplicar then
    update public.socios set estado = 'inactivo', actualizado_at = now()
    where estado = 'activo' and not (mail = any (vistos));
  end if;

  return jsonb_build_object('filas', coalesce(array_length(vistos, 1), 0), 'nuevos', nuevos,
    'siguen_activos', siguen, 'reactivados', reactivados, 'pasan_a_inactivos', bajas, 'no_figuran', ausentes);
end;
$$;

-- Registro de búsquedas con nombres (solo equipo).
create or replace function public.registro_busquedas()
returns table (fecha timestamptz, comercio text, texto text, resultado text, socio text)
language sql
stable
security definer
set search_path = ''
as $$
  select b.fecha, coalesce(c.nombre, '—'), b.texto, b.resultado,
         case when s.id is null then null else trim(s.nombre || ' ' || s.apellido) end
  from public.busquedas b
  left join public.comercios c on c.id = b.comercio_id
  left join public.socios s on s.id = b.socio_id
  where public.es_equipo()
  order by b.fecha desc
  limit 5000;
$$;

-- Quién puede ejecutar cada función
revoke execute on function public.mi_rol(), public.mi_pase(), public.aceptar_privacidad(),
  public.verificar_socio(text), public.importar_socios(jsonb, boolean), public.registro_busquedas(),
  public.es_equipo()
  from public, anon;
grant execute on function public.mi_rol(), public.mi_pase(), public.aceptar_privacidad(),
  public.verificar_socio(text), public.importar_socios(jsonb, boolean), public.registro_busquedas(),
  public.es_equipo()
  to authenticated;

-- ---------- Solo pueden crear cuenta quienes están en las listas ----------
-- Se activa en Authentication → Hooks → "Before User Created" → Postgres
-- → función public.solo_miembros. Así nadie de afuera puede registrarse.
create or replace function public.solo_miembros(event jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  correo text := lower(event -> 'user' ->> 'email');
begin
  if exists (select 1 from public.socios where mail = correo)
     or exists (select 1 from public.comercios where mail = correo and activo)
     or exists (select 1 from public.equipo where mail = correo) then
    return '{}'::jsonb;
  end if;
  return jsonb_build_object('error', jsonb_build_object(
    'http_code', 403,
    'message', 'No encontramos ese mail en la comunidad. Si te suscribiste con otro mail, probá con ese.'));
end;
$$;
grant execute on function public.solo_miembros(jsonb) to supabase_auth_admin;
revoke execute on function public.solo_miembros(jsonb) from authenticated, anon, public;

-- ============================================================
-- ÚLTIMO PASO (editar antes de correr): quiénes son el equipo de Sube.
-- Reemplazá el mail por el de cada persona que va a administrar.
-- ============================================================
insert into public.equipo (mail, nombre) values
  ('laplatasube@gmail.com', 'Equipo Sube')
on conflict (mail) do nothing;
