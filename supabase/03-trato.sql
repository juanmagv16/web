-- ============================================================
-- SUBE — Mi pase: "¿Cómo querés que te nombremos?"
-- ------------------------------------------------------------
-- Cada socio elige si en su pase aparece "Pasajera", "Pasajero"
-- o prefiere no especificarlo. Se pregunta al activar la cuenta
-- (y una sola vez a quienes ya la habían activado).
--
-- Cómo usarlo: en Supabase → SQL Editor, pegá este archivo y
-- tocá "Run". Se puede volver a correr sin problema.
-- ============================================================

alter table public.socios
  add column if not exists trato text check (trato in ('pasajera', 'pasajero', 'neutro'));

-- El boleto ahora también devuelve cómo quiere que lo nombren.
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
    'acepto_privacidad', s.acepto_privacidad_at is not null,
    'trato', s.trato
  );
end;
$$;

-- El socio elige cómo quiere que lo nombren (solo puede cambiar su propia fila).
create or replace function public.elegir_trato(t text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if t not in ('pasajera', 'pasajero', 'neutro') then raise exception 'Opción no válida.'; end if;
  update public.socios set trato = t where user_id = auth.uid();
end;
$$;

revoke execute on function public.elegir_trato(text) from public, anon;
grant execute on function public.elegir_trato(text) to authenticated;
