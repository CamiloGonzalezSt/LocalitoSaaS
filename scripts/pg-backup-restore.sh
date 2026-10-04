#!/usr/bin/env bash
# CP-118: respaldo (pg_dump) y restauración en una base nueva, con comparación de conteos y huellas por tabla.
# Uso: SRC_URL=postgres://u:p@host/base_origen ADMIN_URL=postgres://u:p@host/postgres ./scripts/pg-backup-restore.sh [carpeta_salida]
set -euo pipefail
SRC_URL=${SRC_URL:?Defina SRC_URL (base de prueba con datos)}
ADMIN_URL=${ADMIN_URL:?Defina ADMIN_URL (conexión a la base postgres, con permiso para crear bases)}
OUT=${1:-evidencias_cp118}; mkdir -p "$OUT"
DST_NAME="restore_$(date +%s)"
DST_URL="${SRC_URL%/*}/$DST_NAME"
now() { date +%s.%N; }
fp() { # huella por tabla: conteo y md5 del contenido ordenado
  psql "$1" -At -F '|' -c "select tablename from pg_tables where schemaname='public' order by 1" | while read -r t; do
    psql "$1" -At -F '|' -c "select '$t', count(*), md5(coalesce(string_agg(x::text,'' order by x::text),'')) from \"$t\" x"
  done
}
meta() { psql "$1" -At -F '|' -c "select 'constraints', count(*) from pg_constraint c join pg_namespace n on n.oid=c.connamespace where n.nspname='public' union all select 'indexes', count(*) from pg_indexes where schemaname='public' union all select 'tables', count(*) from pg_tables where schemaname='public'"; }

T0=$(now)
pg_dump "$SRC_URL" -Fc -f "$OUT/respaldo.dump"
T1=$(now)
SHA=$(sha256sum "$OUT/respaldo.dump" | cut -d' ' -f1)
echo "hora_respaldo_utc=$(date -u +%FT%TZ)" | tee "$OUT/resumen.txt"
echo "sha256=$SHA" | tee -a "$OUT/resumen.txt"
echo "tamano_bytes=$(stat -c %s "$OUT/respaldo.dump")" | tee -a "$OUT/resumen.txt"
echo "duracion_respaldo_s=$(echo "$T1 - $T0" | bc)" | tee -a "$OUT/resumen.txt"

# Operación posterior al respaldo (para medir la pérdida respecto al respaldo)
psql "$SRC_URL" -qAt -c "insert into negocios (id,nombre,rubro,estado) values (gen_random_uuid(),'Posterior al respaldo','almacen','activo')"
fp "$SRC_URL" > "$OUT/huella_origen_posterior.txt"

psql "$ADMIN_URL" -qc "create database \"$DST_NAME\""
T2=$(now)
pg_restore --no-owner --exit-on-error -d "$DST_URL" "$OUT/respaldo.dump"
T3=$(now)
echo "duracion_restauracion_s=$(echo "$T3 - $T2" | bc)" | tee -a "$OUT/resumen.txt"
fp "$DST_URL" > "$OUT/huella_restaurada.txt"
meta "$SRC_URL" > "$OUT/meta_origen.txt"; meta "$DST_URL" > "$OUT/meta_restaurada.txt"

# El origen recibió 1 negocio nuevo luego del respaldo: la única diferencia esperada es la tabla negocios.
DIFF=$(diff "$OUT/huella_origen_posterior.txt" "$OUT/huella_restaurada.txt" | grep -c '^[<>]' || true)
echo "tablas_con_diferencia_esperada=$(diff <(cut -d'|' -f1 "$OUT/huella_origen_posterior.txt") <(cut -d'|' -f1 "$OUT/huella_restaurada.txt") | wc -l) lineas_distintas=$DIFF" | tee -a "$OUT/resumen.txt"
diff "$OUT/huella_origen_posterior.txt" "$OUT/huella_restaurada.txt" | tee "$OUT/diferencias.txt" || true
diff "$OUT/meta_origen.txt" "$OUT/meta_restaurada.txt" && echo "estructura_identica=si" | tee -a "$OUT/resumen.txt"
# Verificación de lectura funcional sobre la base restaurada
psql "$DST_URL" -At -c "select 'ventas', count(*) from ventas union all select 'stock_negativo', count(*) from productos where stock_actual<0 union all select 'saldo_negativo', count(*) from cuentas_fiado where saldo_pendiente<0" | tee "$OUT/lecturas_restaurada.txt"
psql "$ADMIN_URL" -qc "drop database \"$DST_NAME\""
