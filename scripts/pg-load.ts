/**
 * CP-123 carga y latencia (versión reducida configurable).
 * Requiere la API corriendo sobre PostgreSQL de prueba y acceso directo a esa misma base.
 *   TEST_DATABASE_URL=... API_BASE=http://127.0.0.1:43201 npx tsx scripts/pg-load.ts salida.json
 * Variables: USERS (10), WARMUP_S (30), MEASURE_S (120), ROUNDS (3), PRODUCTS (1000)
 */
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import pg from "pg";
import { PostgresRepository } from "../apps/api/src/repository.js";

const url = process.env.TEST_DATABASE_URL;
const base = process.env.API_BASE ?? "http://127.0.0.1:43201";
if (!url) throw new Error("Defina TEST_DATABASE_URL.");
const USERS = Number(process.env.USERS ?? 10), WARMUP = Number(process.env.WARMUP_S ?? 30), MEASURE = Number(process.env.MEASURE_S ?? 120), ROUNDS = Number(process.env.ROUNDS ?? 3), PRODUCTS = Number(process.env.PRODUCTS ?? 1000);

type Sample = { kind: string; ms: number; status: number };
const pct = (values: number[], p: number) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); return Number(sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)].toFixed(1)); };

async function main() {
  const pool = new pg.Pool({ connectionString: url, max: 5 });
  const repo = new PostgresRepository(pool);
  const email = `carga-${randomUUID().slice(0, 8)}@prueba.local`;
  const { tenant } = await repo.registerTenant({ name: "Carga", email, password: "Clave12345", businessName: "Negocio carga", businessType: "almacen" });
  const initialStock = 1_000_000;
  const ids: string[] = [];
  for (let i = 0; i < PRODUCTS; i++) ids.push((await repo.createProduct(tenant.id, { name: `Producto ${i}`, category: `Cat ${i % 20}`, costPrice: 400, salePrice: 1000 + (i % 50), stock: initialStock, minimumStock: 1 })).id);
  const login = await (await fetch(`${base}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Clave12345" }) })).json() as { data?: { token: string }; token?: string };
  const token = login.data?.token ?? login.token!;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  async function worker(stopAt: number, samples: Sample[]) {
    while (Date.now() < stopAt) {
      const roll = Math.random();
      const start = performance.now();
      let kind: string, res: Response;
      try {
        if (roll < 0.55) { kind = "GET /products"; res = await fetch(`${base}/products`, { headers }); }
        else if (roll < 0.70) { kind = "GET /sales"; res = await fetch(`${base}/sales`, { headers }); }
        else if (roll < 0.75) { kind = "GET /reports/summary"; res = await fetch(`${base}/reports/summary`, { headers }); }
        else {
          kind = "POST /sales";
          const picks = new Set<string>(); while (picks.size < 1 + Math.floor(Math.random() * 3)) picks.add(ids[Math.floor(Math.random() * ids.length)]);
          res = await fetch(`${base}/sales`, { method: "POST", headers, body: JSON.stringify({ paymentMethod: "cash", idempotencyKey: randomUUID(), items: [...picks].map((productId) => ({ productId, quantity: 1 })) }) });
        }
        await res.arrayBuffer();
        samples.push({ kind, ms: performance.now() - start, status: res.status });
      } catch {
        samples.push({ kind: "red", ms: performance.now() - start, status: 0 });
      }
    }
  }

  const run = async (seconds: number) => { const samples: Sample[] = []; const stopAt = Date.now() + seconds * 1000; await Promise.all(Array.from({ length: USERS }, () => worker(stopAt, samples))); return samples; };
  console.log(`Calentamiento ${WARMUP}s con ${USERS} usuarios...`);
  await run(WARMUP);
  const rounds = [];
  for (let r = 1; r <= ROUNDS; r++) {
    console.log(`Ronda ${r}/${ROUNDS} (${MEASURE}s)...`);
    const s = await run(MEASURE);
    const errors = s.filter((x) => x.status >= 400 || x.status === 0);
    const byKind: Record<string, unknown> = {};
    for (const kind of [...new Set(s.map((x) => x.kind))]) {
      const v = s.filter((x) => x.kind === kind).map((x) => x.ms);
      byKind[kind] = { n: v.length, p50: pct(v, 50), p95: pct(v, 95), p99: pct(v, 99) };
    }
    const all = s.map((x) => x.ms);
    rounds.push({ ronda: r, solicitudes: s.length, rps: Number((s.length / MEASURE).toFixed(1)), errores: errors.length, tasa_error: Number((errors.length / s.length).toFixed(4)), estados_error: [...new Set(errors.map((e) => e.status))], p50: pct(all, 50), p95: pct(all, 95), p99: pct(all, 99), por_tipo: byKind });
  }
  // Integridad: lo descontado del stock debe coincidir con lo vendido y con los movimientos.
  const q = async (sql: string) => Number((await pool.query(sql, [tenant.id])).rows[0].n);
  const descontado = await q(`select coalesce(sum(${initialStock} - stock_actual),0) n from productos where negocio_id=$1`);
  const vendido = await q(`select coalesce(sum(d.cantidad),0) n from detalle_ventas d join ventas v on v.id=d.venta_id where v.negocio_id=$1`);
  const movimientos = await q(`select coalesce(-sum(cantidad),0) n from movimientos_stock where negocio_id=$1 and tipo='sale'`);
  const negativos = await q(`select count(*) n from productos where negocio_id=$1 and stock_actual<0`);
  const ventas = await q(`select count(*) n from ventas where negocio_id=$1`);
  const integridad = { ventas_registradas: ventas, unidades_descontadas: descontado, unidades_en_detalle: vendido, unidades_en_movimientos: movimientos, stock_negativo: negativos, consistente: descontado === vendido && vendido === movimientos && negativos === 0 };
  const result = { fecha_utc: new Date().toISOString(), configuracion: { usuarios_concurrentes: USERS, calentamiento_s: WARMUP, medicion_s: MEASURE, rondas: ROUNDS, productos: PRODUCTS, mezcla: "55% GET /products, 15% GET /sales, 5% GET /reports/summary, 25% POST /sales", nota: "Generador de carga, API y PostgreSQL comparten el mismo equipo; los tiempos no representan un despliegue real." }, rondas: rounds, integridad };
  writeFileSync(process.argv[2] ?? "carga.json", JSON.stringify(result, null, 2));
  console.log(JSON.stringify({ integridad, rondas: rounds.map((r) => ({ ronda: r.ronda, rps: r.rps, p50: r.p50, p95: r.p95, p99: r.p99, errores: r.errores })) }, null, 1));
  await pool.end();
}
main().catch((e) => { console.error(e); process.exit(1); });
