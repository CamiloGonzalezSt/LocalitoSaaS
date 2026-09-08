import type { AuditEvent, AuditPage, AuditQuery } from "@localito/shared";

export function parseAuditQuery(input: Record<string, unknown>): AuditQuery {
  const query: AuditQuery = {};
  const invalid = () => { throw Object.assign(new Error("Los filtros del historial tienen un formato invalido."), { status: 400 }); };
  for (const key of ["search", "action", "from", "to", "cursor"] as const) {
    const value = input[key];
    if (value === undefined || value === "") continue;
    if (typeof value !== "string" || value.length > 160) invalid();
    query[key] = (value as string).trim();
  }
  for (const key of ["from", "to"] as const) {
    if (query[key] && !/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(query[key]!)) invalid();
    if (query[key] && !Number.isFinite(Date.parse(query[key]!))) invalid();
  }
  if (query.from && query.to && query.from >= query.to) invalid();
  if (query.cursor && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(query.cursor)) invalid();
  if (input.limit !== undefined && (typeof input.limit !== "string" || !/^\d+$/.test(input.limit))) invalid();
  query.limit = input.limit === undefined ? 25 : Number(input.limit);
  if (!Number.isInteger(query.limit) || query.limit < 1 || query.limit > 100) invalid();
  return query;
}

export function auditPage(events: AuditEvent[], limit = 25): AuditPage {
  return { events: events.slice(0, limit), nextCursor: events.length > limit ? events[limit - 1].id : undefined };
}

export function filterAudit(events: AuditEvent[], tenantId: string, query: AuditQuery): AuditPage {
  const scoped = events.filter(event => event.tenantId === tenantId);
  const cursor = query.cursor ? scoped.find(event => event.id === query.cursor) : undefined;
  if (query.cursor && !cursor) return { events: [] };
  const compare = (a: AuditEvent, b: AuditEvent) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);
  const search = (query.search ?? "").toLocaleLowerCase();
  const filtered = scoped.filter(event => (!cursor || compare(event, cursor) < 0) && (!query.action || query.action === event.action) && (!query.from || event.createdAt >= query.from) && (!query.to || event.createdAt < query.to) && [event.userName, event.entityId, event.action, event.entity, JSON.stringify(event.details)].join(" ").toLocaleLowerCase().includes(search));
  return auditPage(filtered.sort((a, b) => compare(b, a)), query.limit);
}

export function auditSql(tenantId: string, query: AuditQuery) {
  const values: unknown[] = [tenantId];
  const bind = (value: unknown) => { values.push(value); return `$${values.length}`; };
  const where = ["a.negocio_id = $1"];
  if (query.action) where.push(`a.accion = ${bind(query.action)}`);
  if (query.from) where.push(`a.fecha_creacion >= ${bind(query.from)}::timestamptz`);
  if (query.to) where.push(`a.fecha_creacion < ${bind(query.to)}::timestamptz`);
  if (query.search) where.push(`strpos(lower(concat_ws(' ', u.nombre, a.entidad_id, a.accion, a.entidad, a.detalle::text)), lower(${bind(query.search)})) > 0`);
  // Resolve the cursor in this tenant, preserving PostgreSQL timestamp precision.
  if (query.cursor) where.push(`(a.fecha_creacion, a.id) < (select fecha_creacion, id from auditoria where negocio_id = $1 and id = ${bind(query.cursor)}::uuid)`);
  return { text: `select a.*, u.nombre as user_name from auditoria a left join usuarios u on u.id = a.usuario_id where ${where.join(" and ")} order by a.fecha_creacion desc, a.id desc limit ${bind((query.limit ?? 25) + 1)}`, values };
}
