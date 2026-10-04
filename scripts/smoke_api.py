"""Prueba de humo ampliada de la API: recorre los flujos principales y registra el código HTTP de cada paso.

Sirve para comparar el comportamiento en memoria y en PostgreSQL: un paso que responde 5xx solo en una
de las dos bases revela un defecto de esa implementación.
Uso: API_BASE=http://127.0.0.1:43201 python3 smoke_api.py salida.json
"""
import json, os, sys, uuid, urllib.request, urllib.error

BASE = os.environ.get('API_BASE', 'http://127.0.0.1:43201')
steps = []


def call(name, path, method='GET', data=None, token=None, expect=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(BASE + path, data=json.dumps(data).encode() if data is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            status, raw = r.status, r.read()
    except urllib.error.HTTPError as e:
        status, raw = e.code, e.read()
    try:
        body = json.loads(raw) if raw else {}
    except ValueError:
        body = {'raw': raw[:200].decode(errors='replace')}
    ok = status < 500 if expect is None else status in (expect if isinstance(expect, (list, tuple)) else [expect])
    steps.append({'paso': name, 'metodo': method, 'ruta': path.split('?')[0], 'status': status, 'ok': ok, 'mensaje': (body.get('message') if isinstance(body, dict) else None)})
    return body.get('data', body) if isinstance(body, dict) else body


def main():
    s = uuid.uuid4().hex[:8]
    reg = call('registro de negocio', '/auth/register', 'POST', {'businessName': f'Negocio {s}', 'businessType': 'almacen', 'ownerName': 'Dueño Prueba', 'email': f'dueno-{s}@prueba.local', 'password': 'Clave12345'}, expect=[200, 201])
    token = reg.get('token') or reg.get('session', {}).get('token')
    if not token:
        login = call('login', '/auth/login', 'POST', {'email': f'dueno-{s}@prueba.local', 'password': 'Clave12345'}, expect=200)
        token = login.get('token')
    t = token
    call('bootstrap', '/bootstrap', token=t, expect=200)
    for path in ['/users', '/products', '/customers', '/sales', '/suppliers', '/purchases', '/debts', '/debts/reminders', '/cash/session', '/cash/movements', '/cash/reconciliation',
                 '/stock-movements', '/audit', '/audit/history', '/alerts', '/reports/summary', '/reports/cash-register', '/cash-closures', '/ai/history', '/subscription']:
        call('listar ' + path, path, token=t, expect=200)

    p1 = call('crear producto 1', '/products', 'POST', {'name': 'Arroz', 'category': 'Abarrotes', 'costPrice': 700, 'salePrice': 1000, 'stock': 20, 'minimumStock': 3, 'barcode': f'77{s}1'}, t, expect=201)
    p2 = call('crear producto 2', '/products', 'POST', {'name': 'Leche', 'category': 'Lácteos', 'costPrice': 600, 'salePrice': 900, 'stock': 10, 'minimumStock': 2}, t, expect=201)
    call('editar producto', f"/products/{p1['id']}", 'PATCH', {'salePrice': 1100}, t, expect=200)
    call('ajustar stock', f"/products/{p2['id']}/stock", 'PATCH', {'quantity': 12}, t, expect=[200, 400])
    call('importar productos CSV', '/products/import', 'POST', {'rows': [{'name': f'Importado {s}', 'category': 'Varios', 'salePrice': 500, 'costPrice': 300, 'stock': 5, 'minimumStock': 1}], 'fileName': 'p.csv'}, t, expect=[200, 201, 400])
    c = call('crear cliente', '/customers', 'POST', {'name': 'Cliente Prueba', 'phone': '+56911111111', 'creditLimit': 50000, 'creditDays': 15}, t, expect=201)
    call('editar cliente', f"/customers/{c['id']}", 'PATCH', {'notes': 'nota'}, t, expect=200)
    sup = call('crear proveedor', '/suppliers', 'POST', {'name': 'Proveedor Prueba'}, t, expect=201)
    call('editar proveedor', f"/suppliers/{sup['id']}", 'PATCH', {'notes': 'ok'}, t, expect=200)
    po = call('crear orden de compra', '/purchases', 'POST', {'supplierId': sup['id'], 'items': [{'productId': p1['id'], 'quantity': 10, 'unitCost': 650}]}, t, expect=201)
    call('recibir compra parcial', f"/purchases/{po['id']}/receive", 'POST', {'quantities': {p1['id']: 4}}, t, expect=200)
    call('recibir compra total', f"/purchases/{po['id']}/receive", 'POST', {}, t, expect=200)

    call('abrir caja', '/cash/session/open', 'POST', {'openingAmount': 10000}, t, expect=201)
    call('segunda apertura de caja', '/cash/session/open', 'POST', {'openingAmount': 10000}, t, expect=[400, 409])
    sale = call('venta contado', '/sales', 'POST', {'paymentMethod': 'cash', 'idempotencyKey': f'smoke-{s}-1', 'items': [{'productId': p1['id'], 'quantity': 2}, {'productId': p2['id'], 'quantity': 1}]}, t, expect=201)
    call('venta mixta', '/sales', 'POST', {'paymentMethod': 'mixed', 'idempotencyKey': f'smoke-{s}-2', 'payments': [{'method': 'cash', 'amount': 1000}, {'method': 'card', 'amount': 900}], 'items': [{'productId': p1['id'], 'quantity': 1}, {'productId': p2['id'], 'quantity': 1}], 'discount': 100}, t, expect=201)
    credit = call('venta fiada', '/sales', 'POST', {'paymentMethod': 'credit', 'customerId': c['id'], 'idempotencyKey': f'smoke-{s}-3', 'items': [{'productId': p1['id'], 'quantity': 3}]}, t, expect=201)
    call('abono de deuda', f"/customers/{c['id']}/payments", 'POST', {'amount': 1000, 'method': 'cash'}, t, expect=[200, 201])
    call('estado de cuenta', f"/customers/{c['id']}/statement", token=t, expect=200)
    call('devolución parcial', f"/sales/{sale['id']}/returns", 'POST', {'items': [{'productId': p1['id'], 'quantity': 1}], 'reason': 'Producto dañado'}, t, expect=201)
    call('anular venta', f"/sales/{credit['id']}/cancel", 'POST', {'reason': 'Error de digitación'}, t, expect=[200, 201])
    call('movimiento de caja', '/cash/movements', 'POST', {'type': 'expense', 'amount': 500, 'reason': 'Bolsas'}, t, expect=201)
    call('cerrar caja con diferencia sin motivo', '/cash/session/close', 'POST', {'countedAmount': 1}, t, expect=400)
    call('cerrar caja', '/cash/session/close', 'POST', {'countedAmount': 1, 'note': 'Diferencia de prueba'}, t, expect=200)
    call('cierre diario', '/cash-closures', 'POST', {'note': 'cierre de prueba'}, t, expect=[200, 201, 400])
    call('listar cierres', '/cash-closures', token=t, expect=200)

    call('pago webpay (sandbox)', '/payments/webpay/create', 'POST', {'amount': 1000}, t, expect=[200, 201, 400])
    call('cambiar plan', '/subscription/change-plan', 'POST', {'plan': 'pro', 'provider': 'transfer'}, t, expect=[200, 201])
    call('preferencias del negocio', '/tenant/preferences', 'PATCH', {}, t, expect=[200, 400])
    call('editar negocio', '/tenant', 'PATCH', {'name': f'Negocio {s} editado'}, t, expect=[200, 400])

    seller = call('crear vendedor', '/users', 'POST', {'name': 'Vendedor', 'email': f'vend-{s}@prueba.local', 'password': 'Clave12345', 'role': 'seller'}, t, expect=201)
    call('editar usuario', f"/users/{seller['id']}", 'PATCH', {'name': 'Vendedor 2'}, t, expect=200)
    call('clave de usuario', f"/users/{seller['id']}/password", 'POST', {'password': 'OtraClave123'}, t, expect=[200, 204])
    call('eliminar usuario', f"/users/{seller['id']}", 'DELETE', None, t, expect=[200, 204])
    call('desactivar producto', f"/products/{p2['id']}", 'DELETE', None, t, expect=[200, 204])
    call('desactivar cliente', f"/customers/{c['id']}", 'DELETE', None, t, expect=[200, 204])
    call('logout', '/auth/logout', 'POST', None, t, expect=[200, 204])


if __name__ == '__main__':
    try:
        main()
    finally:
        out = sys.argv[1] if len(sys.argv) > 1 else 'smoke_api.json'
        json.dump({'base': BASE, 'pasos': steps}, open(out, 'w'), ensure_ascii=False, indent=1)
        bad = [x for x in steps if not x['ok']]
        print(f"{len(steps)} pasos, {len(bad)} fuera de lo esperado")
        for b in bad:
            print(' ', b['paso'], b['status'], b['mensaje'])
