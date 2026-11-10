-- ============================================================
-- SUBE · Mi pase — Resumen para cada comercio
-- ------------------------------------------------------------
-- Agrega una función para que cada comercio vea, en su pantalla de
-- Mi pase, cuántas verificaciones hizo (este mes y en total).
-- Solo devuelve números: nunca nombres ni datos de las personas.
--
-- Cómo usarlo: Supabase → SQL Editor → pegar todo → Run.
-- Se puede correr más de una vez sin problema.
-- Mientras no se corra, la web funciona igual: solo no muestra el resumen.
-- ============================================================

create or replace function public.mi_resumen_comercio()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  c public.comercios;
  inicio_mes timestamptz := date_trunc('month', now() at time zone 'America/Argentina/Buenos_Aires')
                            at time zone 'America/Argentina/Buenos_Aires';
begin
  select * into c from public.comercios where user_id = auth.uid() and activo;
  if not found then
    return null;
  end if;
  return (
    select jsonb_build_object(
      'mes',        count(*) filter (where b.fecha >= inicio_mes),
      'mes_al_dia', count(*) filter (where b.fecha >= inicio_mes and b.resultado = 'activo'),
      'total',      count(*)
    )
    from public.busquedas b
    where b.comercio_id = c.id
  );
end;
$$;

revoke execute on function public.mi_resumen_comercio() from public, anon;
grant execute on function public.mi_resumen_comercio() to authenticated;
