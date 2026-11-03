// ============================================================
// SUBE — Función "redaccion" (Supabase Edge Function)
// ------------------------------------------------------------
// Es el puente entre el panel /redaccion y GitHub:
//   1. Comprueba que quien llama haya ingresado con su usuario de SUBE
//      y sea de la redacción (o del equipo).
//   2. Guarda borradores en la tabla "notas" (privada).
//   3. Al publicar, escribe la nota en GitHub (carpeta redaccion/) con
//      una llave que solo vive acá, en los "Secrets" de Supabase.
//      GitHub regenera y publica la web sola en uno o dos minutos.
//
// Secrets que hay que cargar (Supabase → Edge Functions → Secrets):
//   GITHUB_TOKEN   llave de GitHub limitada a este repositorio
//                  (permiso "Contents: Read and write")
//   GITHUB_REPO    por ejemplo  juanmagv16/web   (oficial: subecanal/web)
//   GITHUB_BRANCH  main   (opcional)
//
// La llave NUNCA llega al navegador de nadie.
// ============================================================

import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.115.0";
import { parse as parseYaml } from "npm:yaml@2.6.1";

const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN") ?? "";
const REPO = Deno.env.get("GITHUB_REPO") ?? "juanmagv16/web";
const BRANCH = Deno.env.get("GITHUB_BRANCH") ?? "main";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const CLAVE_PUBLICA = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const ORIGENES = (Deno.env.get("ORIGENES") ??
  "https://juanmagv16.github.io,https://subecanal.com.ar,https://www.subecanal.com.ar,http://localhost:8000")
  .split(",").map((s) => s.trim()).filter(Boolean);

const CARPETA_NOTAS = "redaccion";
const CARPETA_FOTOS = "assets/noticias";
const MAX_FOTO_BYTES = 8 * 1024 * 1024;

function encodeBase64(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
}

function decodeBase64(b64: string): Uint8Array {
  const bin = atob(b64.replace(/[^A-Za-z0-9+/=]/g, ""));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

class Problema extends Error {
  constructor(msg: string, public status = 400) { super(msg); }
}

// ---------- utilidades ----------

function cors(origen: string | null): Record<string, string> {
  const permitido = origen && ORIGENES.includes(origen) ? origen : ORIGENES[0];
  return {
    "Access-Control-Allow-Origin": permitido,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function slugify(texto: string): string {
  let t = (texto || "").toLowerCase();
  for (const [a, b] of [["á", "a"], ["é", "e"], ["í", "i"], ["ó", "o"], ["ú", "u"], ["ü", "u"], ["ñ", "n"]]) {
    t = t.split(a).join(b);
  }
  t = t.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.slice(0, 80).replace(/-+$/, "") || "nota";
}

function hoyAR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Argentina/Buenos_Aires" }).format(new Date());
}

function texto(v: unknown, max = 20000): string {
  return String(v ?? "").replace(/\r\n/g, "\n").trim().slice(0, max);
}

// Ordena y limpia lo que manda el panel
function limpiarNota(n: Record<string, unknown>) {
  const fecha = texto(n.fecha, 10);
  const jer = texto(n.jerarquia, 20);
  return {
    titulo: texto(n.titulo, 300),
    seccion: texto(n.seccion, 60) || "Actualidad",
    fecha: /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : hoyAR(),
    bajada: texto(n.bajada, 1000),
    autor: texto(n.autor, 120),
    imagen: texto(n.imagen, 500),
    epigrafe: texto(n.epigrafe, 300),
    video: texto(n.video, 300),
    portada: texto(n.portada) === "Video" ? "Video" : "Foto",
    jerarquia: ["Principal", "Destacada", "Normal"].includes(jer) ? jer : "Normal",
    visible: n.visible !== false,
    cuerpo: texto(n.cuerpo, 100000),
  };
}

// ---------- GitHub ----------

async function gh(ruta: string, init: RequestInit = {}) {
  if (!GITHUB_TOKEN) throw new Problema("Falta configurar la llave de GitHub (GITHUB_TOKEN) en Supabase.", 500);
  const r = await fetch(`https://api.github.com/repos/${REPO}/${ruta}`, {
    ...init,
    headers: {
      "Authorization": `Bearer ${GITHUB_TOKEN}`,
      "Accept": "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "sube-redaccion",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (r.status === 404) return null;
  if (!r.ok) {
    const cuerpo = await r.text();
    console.error("GitHub", r.status, ruta, cuerpo.slice(0, 500));
    if (r.status === 401 || r.status === 403) {
      throw new Problema("GitHub rechazó la llave de la redacción. Hay que revisar GITHUB_TOKEN en Supabase.", 502);
    }
    if (r.status === 409 || r.status === 422) {
      throw new Problema("La nota cambió en GitHub mientras la editabas. Volvé a abrirla y probá de nuevo.", 409);
    }
    throw new Problema("No pudimos conectarnos con GitHub. Probá de nuevo en un minuto.", 502);
  }
  return await r.json();
}

async function listarArchivos(): Promise<Array<{ name: string; path: string; sha: string }>> {
  const lista = await gh(`contents/${CARPETA_NOTAS}?ref=${BRANCH}`);
  if (!Array.isArray(lista)) return [];
  return lista.filter((f: { type: string; name: string }) =>
    f.type === "file" && f.name.endsWith(".md") && !f.name.startsWith("_") && !/^leeme/i.test(f.name));
}

async function leerArchivo(ruta: string): Promise<{ texto: string; sha: string } | null> {
  const f = await gh(`contents/${ruta}?ref=${BRANCH}`);
  if (!f || !f.content) return null;
  const bytes = decodeBase64(String(f.content).replace(/\n/g, ""));
  return { texto: new TextDecoder().decode(bytes), sha: f.sha };
}

async function escribirArchivo(ruta: string, contenido: Uint8Array, mensaje: string, sha?: string | null) {
  const r = await gh(`contents/${ruta}`, {
    method: "PUT",
    body: JSON.stringify({ message: mensaje, content: encodeBase64(contenido), branch: BRANCH, ...(sha ? { sha } : {}) }),
  });
  return r?.content?.sha as string;
}

async function borrarArchivo(ruta: string, mensaje: string) {
  const actual = await gh(`contents/${ruta}?ref=${BRANCH}`);
  if (!actual) return;
  await gh(`contents/${ruta}`, {
    method: "DELETE",
    body: JSON.stringify({ message: mensaje, sha: actual.sha, branch: BRANCH }),
  });
}

// ---------- formato de las notas (.md con encabezado) ----------

function q(v: string): string {
  return JSON.stringify(v ?? ""); // YAML acepta comillas dobles con los mismos escapes que JSON
}

function armarArchivo(n: ReturnType<typeof limpiarNota>): string {
  const lineas = [
    "---",
    `titulo: ${q(n.titulo)}`,
    `seccion: ${q(n.seccion)}`,
    `fecha: ${q(n.fecha)}`,
    `bajada: ${q(n.bajada)}`,
    `autor: ${q(n.autor)}`,
    `imagen: ${q(n.imagen)}`,
    `epigrafe: ${q(n.epigrafe)}`,
    `video: ${q(n.video)}`,
    `portada: ${q(n.portada)}`,
    `jerarquia: ${q(n.jerarquia)}`,
    `publicar: ${n.visible ? "true" : "false"}`,
    "---",
  ];
  return lineas.join("\n") + "\n" + (n.cuerpo ? n.cuerpo.trim() + "\n" : "");
}

function leerNotaDeArchivo(raw: string) {
  const m = raw.replace(/\r\n/g, "\n").match(/^---\s*\n([\s\S]*?)\n---\s*(?:\n|$)([\s\S]*)$/);
  if (!m) return null;
  let d: Record<string, unknown> = {};
  try { d = (parseYaml(m[1]) as Record<string, unknown>) ?? {}; } catch { return null; }
  const s = (v: unknown) => v instanceof Date ? v.toISOString().slice(0, 10) : (v == null ? "" : String(v).trim());
  const pub = d.publicar;
  const visible = !(pub === false || /^(no|false|0)$/i.test(s(pub)));
  let jer = s(d.jerarquia);
  jer = /^principal$/i.test(jer) ? "Principal" : /^destacada$/i.test(jer) ? "Destacada"
    : (/^(si|sí|true)$/i.test(s(d.destacada)) ? "Destacada" : "Normal");
  return limpiarNota({
    titulo: s(d.titulo), seccion: s(d.seccion), fecha: s(d.fecha), bajada: s(d.bajada),
    autor: s(d.autor), imagen: s(d.imagen), epigrafe: s(d.epigrafe), video: s(d.video),
    portada: /^video/i.test(s(d.portada)) ? "Video" : "Foto", jerarquia: jer, visible,
    cuerpo: m[2],
  });
}

// ---------- acciones ----------

type Ctx = { sb: SupabaseClient; nombre: string; userId: string; esEquipo: boolean };

const COLUMNAS_LISTA = "id, archivo, titulo, seccion, fecha, autor, imagen, video, portada, jerarquia, visible, estado, " +
  "cambios_sin_publicar, creado_por_nombre, actualizado_por_nombre, actualizado_at, publicado_at";

async function dbOk<T>(p: PromiseLike<{ data: T; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) {
    console.error("DB", error);
    throw new Problema("No pudimos guardar en la base de datos. Probá de nuevo.", 500);
  }
  return data;
}

// Trae a la tabla las notas que están en GitHub (las ya publicadas,
// o las que alguien editó directamente en el repositorio).
async function sincronizar(ctx: Ctx) {
  const archivos = await listarArchivos();
  const filas = await dbOk(ctx.sb.from("notas").select("id, archivo, sha, cambios_sin_publicar").not("archivo", "is", null)) as
    Array<{ id: string; archivo: string; sha: string; cambios_sin_publicar: boolean }>;
  const porArchivo = new Map(filas.map((f) => [f.archivo, f]));
  const enRepo = new Set(archivos.map((a) => a.path));

  for (const a of archivos) {
    const fila = porArchivo.get(a.path);
    if (fila && fila.sha === a.sha) continue;
    if (fila && fila.cambios_sin_publicar) {
      // Hay cambios del panel sin publicar: se respetan y se toma la versión nueva de GitHub como base.
      await dbOk(ctx.sb.from("notas").update({ sha: a.sha }).eq("id", fila.id));
      continue;
    }
    const f = await leerArchivo(a.path);
    const n = f && leerNotaDeArchivo(f.texto);
    if (!f || !n) continue;
    const datos = { ...n, archivo: a.path, sha: f.sha, estado: n.visible ? "publicada" : "fuera", cambios_sin_publicar: false };
    if (fila) {
      await dbOk(ctx.sb.from("notas").update(datos).eq("id", fila.id));
    } else {
      await dbOk(ctx.sb.from("notas").insert({ ...datos, creado_por_nombre: n.autor || "Redacción SUBE", publicado_at: new Date().toISOString() }));
    }
  }
  // Notas que ya no están en GitHub: quedan como borrador en el panel.
  for (const f of filas) {
    if (!enRepo.has(f.archivo)) {
      await dbOk(ctx.sb.from("notas").update({ archivo: null, sha: null, estado: "borrador", cambios_sin_publicar: false }).eq("id", f.id));
    }
  }
}

async function listar(ctx: Ctx) {
  let aviso = "";
  try { await sincronizar(ctx); } catch (e) {
    console.error("sincronizar", e);
    aviso = e instanceof Problema ? e.message : "No pudimos revisar las notas publicadas en GitHub.";
  }
  const notas = await dbOk(ctx.sb.from("notas").select(COLUMNAS_LISTA)
    .order("fecha", { ascending: false }).order("actualizado_at", { ascending: false }));
  return { notas, aviso, repo: REPO, rama: BRANCH, nombre: ctx.nombre, equipo: ctx.esEquipo };
}

async function leer(ctx: Ctx, id: string) {
  const nota = await dbOk(ctx.sb.from("notas").select("*").eq("id", id).maybeSingle());
  if (!nota) throw new Problema("Esa nota ya no existe.", 404);
  return { nota };
}

async function guardar(ctx: Ctx, entrada: Record<string, unknown>) {
  const n = limpiarNota(entrada);
  const id = texto(entrada.id, 60);
  if (id) {
    const actual = await dbOk(ctx.sb.from("notas").select("id, estado").eq("id", id).maybeSingle()) as { estado: string } | null;
    if (!actual) throw new Problema("Esa nota ya no existe.", 404);
    const nota = await dbOk(ctx.sb.from("notas").update({
      ...n,
      cambios_sin_publicar: actual.estado !== "borrador",
      actualizado_por_nombre: ctx.nombre,
      actualizado_at: new Date().toISOString(),
    }).eq("id", id).select("*").single());
    return { nota };
  }
  const nota = await dbOk(ctx.sb.from("notas").insert({
    ...n,
    creado_por: ctx.userId,
    creado_por_nombre: ctx.nombre,
    actualizado_por_nombre: ctx.nombre,
  }).select("*").single());
  return { nota };
}

async function publicar(ctx: Ctx, entrada: Record<string, unknown>) {
  const n = limpiarNota(entrada);
  if (!n.titulo) throw new Problema("La nota necesita un título para publicarse.");
  const { nota: guardada } = await guardar(ctx, entrada) as { nota: Record<string, string> };

  let ruta = guardada.archivo as string | null;
  if (!ruta) {
    // Dirección nueva: fecha + título, sin repetir ninguna existente
    const usados = new Set((await listarArchivos()).map((a) => a.name.replace(/\.md$/, "").replace(/^\d{4}-\d{2}-\d{2}-?/, "")));
    const base = slugify(n.titulo);
    let slug = base;
    for (let i = 2; usados.has(slug); i++) slug = `${base}-${i}`;
    ruta = `${CARPETA_NOTAS}/${n.fecha}-${slug}.md`;
  }
  const actual = await gh(`contents/${ruta}?ref=${BRANCH}`);
  const sha = await escribirArchivo(
    ruta,
    new TextEncoder().encode(armarArchivo(n)),
    `Redacción: ${n.visible ? "" : "fuera de la web "}«${n.titulo.slice(0, 70)}» (${ctx.nombre || "panel"})`,
    actual?.sha,
  );
  const nota = await dbOk(ctx.sb.from("notas").update({
    archivo: ruta,
    sha,
    estado: n.visible ? "publicada" : "fuera",
    cambios_sin_publicar: false,
    publicado_at: new Date().toISOString(),
  }).eq("id", guardada.id).select("*").single());
  return { nota };
}

async function borrar(ctx: Ctx, id: string) {
  const nota = await dbOk(ctx.sb.from("notas").select("id, archivo, titulo").eq("id", id).maybeSingle()) as
    { id: string; archivo: string | null; titulo: string } | null;
  if (!nota) return { ok: true };
  if (nota.archivo) {
    if (!ctx.esEquipo) {
      throw new Problema("Las notas publicadas solo las puede borrar la coordinación. Para sacarla de la web, apagá «Visible en la web» y tocá Publicar.", 403);
    }
    await borrarArchivo(nota.archivo, `Redacción: nota borrada «${nota.titulo.slice(0, 70)}» (${ctx.nombre})`);
  }
  await dbOk(ctx.sb.from("notas").delete().eq("id", id));
  return { ok: true };
}

async function subirFoto(ctx: Ctx, entrada: Record<string, unknown>) {
  const tipo = texto(entrada.tipo, 40);
  const ext = ({ "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" } as Record<string, string>)[tipo];
  if (!ext) throw new Problema("La foto tiene que ser JPG, PNG o WEBP.");
  const bytes = decodeBase64(String(entrada.datos ?? ""));
  if (!bytes.length) throw new Problema("No llegó la foto. Probá de nuevo.");
  if (bytes.length > MAX_FOTO_BYTES) throw new Problema("La foto es muy pesada (máximo 8 MB).");
  const base = slugify(texto(entrada.nombre, 80).replace(/\.[a-z0-9]+$/i, "")).slice(0, 40);
  const azar = crypto.randomUUID().slice(0, 6);
  const nombre = `${hoyAR()}-${base}-${azar}.${ext}`;
  // [skip ci]: la web no se regenera solo por subir una foto; se publica junto con la nota.
  await escribirArchivo(`${CARPETA_FOTOS}/${nombre}`, bytes, `Redacción: foto ${nombre} (${ctx.nombre}) [skip ci]`);
  return { imagen: nombre };
}

// ---------- entrada ----------

Deno.serve(async (req) => {
  const encabezados = cors(req.headers.get("Origin"));
  if (req.method === "OPTIONS") return new Response("ok", { headers: encabezados });
  const responder = (cuerpo: unknown, status = 200) =>
    new Response(JSON.stringify(cuerpo), { status, headers: { ...encabezados, "Content-Type": "application/json" } });

  try {
    if (req.method !== "POST") throw new Problema("Método no permitido.", 405);
    const auth = req.headers.get("Authorization") ?? "";
    const jwt = auth.replace(/^Bearer\s+/i, "");
    if (!jwt) throw new Problema("Tenés que ingresar.", 401);

    const sb = createClient(SUPABASE_URL, CLAVE_PUBLICA || (req.headers.get("apikey") ?? ""), {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: u, error: errU } = await sb.auth.getUser(jwt);
    if (errU || !u?.user) throw new Problema("Tu sesión venció. Volvé a ingresar.", 401);

    const [puede, equipo, nombre] = await Promise.all([
      sb.rpc("puede_redactar"), sb.rpc("es_equipo"), sb.rpc("mi_nombre_redaccion"),
    ]);
    if (puede.error) {
      console.error(puede.error);
      throw new Problema("Falta preparar la base de datos de la redacción (03-redaccion-notas.sql).", 500);
    }
    if (puede.data !== true) throw new Problema("Tu cuenta no tiene acceso a Redacción.", 403);

    const ctx: Ctx = { sb, userId: u.user.id, esEquipo: equipo.data === true, nombre: String(nombre.data || u.user.email || "") };
    const entrada = await req.json().catch(() => ({})) as Record<string, unknown>;
    const nota = (entrada.nota ?? {}) as Record<string, unknown>;

    switch (entrada.accion) {
      case "listar": return responder(await listar(ctx));
      case "leer": return responder(await leer(ctx, texto(entrada.id, 60)));
      case "guardar": return responder(await guardar(ctx, nota));
      case "publicar": return responder(await publicar(ctx, nota));
      case "borrar": return responder(await borrar(ctx, texto(entrada.id, 60)));
      case "subir_foto": return responder(await subirFoto(ctx, entrada));
      default: throw new Problema("Acción desconocida.");
    }
  } catch (e) {
    if (e instanceof Problema) return responder({ error: e.message }, e.status);
    console.error(e);
    return responder({ error: "Algo salió mal. Probá de nuevo en un minuto." }, 500);
  }
});
