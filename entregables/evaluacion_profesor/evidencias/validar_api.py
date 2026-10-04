"""Verificación HTTP sobre una instancia LOCAL y efímera de Localito.
No usa cuentas reales ni proveedores externos. Requiere API en memoria.
Ejecutar: python validar_api.py
"""
import json, time, uuid, urllib.request, urllib.error
from pathlib import Path
from datetime import datetime, timezone

BASE = 'http://127.0.0.1:43201'
ROOT = Path(__file__).resolve().parent
records = []

def request(path, method='GET', data=None, token=None, extra=None):
    headers = {'Content-Type': 'application/json'}
    if token: headers['Authorization'] = 'Bearer ' + token
    headers.update(extra or {})
    req = urllib.request.Request(BASE+path, data=json.dumps(data).encode() if data is not None else None, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=10) as r: status, body = r.status, r.read()
    except urllib.error.HTTPError as e: status, body = e.code, e.read()
    return status, json.loads(body) if body else {}

def expect(path, status=200, **kwargs):
    code, body = request(path, **kwargs)
    assert code == status, (path, code, body)
    return body.get('data', body)

def check(identifier, name, expected, action):
    start=time.perf_counter()
    try:
        obtained=action()
        records.append(dict(id=identifier,name=name,expected=expected,obtained=obtained,status='Aprobado',duration_ms=round((time.perf_counter()-start)*1000,2)))
    except Exception as e:
        records.append(dict(id=identifier,name=name,expected=expected,obtained=str(e),status='Fallido'))
        raise

def main():
    health=expect('/health')
    assert health.get('storage') == 'memory', 'La campaña solo admite almacenamiento efímero en memoria'
    suffix=uuid.uuid4().hex
    password='TesisLocal2026'
    def register(label):
        return expect('/auth/register',status=201,method='POST',data={'ownerName':'Evaluación '+label,'businessName':'Negocio sintético '+label,'businessType':'QA','email':label+suffix+'@localito.test','password':password})
    a,b=register('a'),register('b')
    ta,tb=a['token'],b['token']
    check('HTTP01','Acceso sin sesión','401 al consultar productos',lambda: {'status':request('/products')[0]} if expect('/products',status=401) else None)
    check('HTTP02','Clave incorrecta','401 al iniciar sesión',lambda: expect('/auth/login',status=401,method='POST',data={'email':'a'+suffix+'@localito.test','password':'Incorrecta2026'}))
    pa=expect('/products',status=201,method='POST',token=ta,data={'name':'Producto A','category':'Prueba','salePrice':1000,'costPrice':500,'stock':10})
    pb=expect('/products',status=201,method='POST',token=tb,data={'name':'Producto B','category':'Prueba','salePrice':2000,'stock':6})
    def isolation():
        rows=expect('/products',token=ta,extra={'x-tenant-id':b['tenant']['id']})
        assert {p['id'] for p in rows}=={pa['id']}
        return {'productos_A':len(rows),'productos_B_visibles':0}
    check('HTTP03','Aislamiento de lectura','Solo producto A al alterar cabecera de negocio',isolation)
    def foreign():
        expect('/products/'+pb['id'],status=404,method='PATCH',token=ta,data={'name':'Cambio no autorizado'})
        assert expect('/products',token=tb)[0]['name']=='Producto B'
        return {'status':404,'producto_B_sin_cambios':True}
    check('HTTP04','Aislamiento de escritura','404 y ningún cambio sobre producto B',foreign)
    seller=expect('/users',status=201,method='POST',token=ta,data={'name':'Vendedor sintético','email':'s'+suffix+'@localito.test','password':password,'role':'seller'})
    st=expect('/auth/login',method='POST',data={'email':seller['email'],'password':password})['token']
    check('HTTP05','Permiso vendedor','403 al crear productos',lambda: expect('/products',status=403,method='POST',token=st,data={'name':'Prohibido','category':'Prueba','salePrice':1,'stock':1}))
    def rejected():
        before=expect('/bootstrap',token=ta)
        expect('/sales',status=400,method='POST',token=ta,data={'paymentMethod':'cash','items':[{'productId':pa['id'],'quantity':-1}]})
        after=expect('/bootstrap',token=ta)
        assert after['products'][0]['stock']==10 and len(after['sales'])==len(before['sales'])
        return {'status':400,'stock':10,'ventas_nuevas':0}
    check('HTTP06','Venta inválida sin efectos','Rechazo de cantidad negativa y conservación de stock',rejected)
    payload={'paymentMethod':'cash','idempotencyKey':'qa-'+suffix,'items':[{'productId':pa['id'],'quantity':2}]}
    sale=expect('/sales',status=201,method='POST',token=ta,data=payload)
    def stock():
        boot=expect('/bootstrap',token=ta)
        assert sale['total']==2000 and boot['products'][0]['stock']==8
        return {'total_CLP':sale['total'],'stock_final':8}
    check('HTTP07','Venta y descuento de stock','Venta por 2000 CLP y stock de 10 a 8',stock)
    def retry():
        repeated=expect('/sales',status=201,method='POST',token=ta,data=payload)
        boot=expect('/bootstrap',token=ta)
        assert repeated['id']==sale['id'] and len(boot['sales'])==1 and boot['products'][0]['stock']==8
        return {'misma_venta':True,'ventas':1,'stock':8}
    check('HTTP08','Reintento idempotente','Una venta y stock 8 tras repetir la misma clave',retry)
    customer=expect('/customers',status=201,method='POST',token=ta,data={'name':'Cliente sintético','creditLimit':5000})
    def credit():
        expect('/sales',status=201,method='POST',token=ta,data={'paymentMethod':'credit','customerId':customer['id'],'items':[{'productId':pa['id'],'quantity':1}]})
        c=next(x for x in expect('/customers',token=ta) if x['id']==customer['id'])
        assert c['debtBalance']==1000
        assert expect('/products',token=ta)[0]['stock']==7
        return {'deuda_CLP':1000,'stock_final':7}
    check('HTTP09','Venta fiada','Deuda de 1000 CLP vinculada al cliente',credit)
    def pay():
        expect('/customers/'+customer['id']+'/payments',status=200,method='POST',token=ta,data={'amount':400,'method':'cash'})
        c=next(x for x in expect('/customers',token=ta) if x['id']==customer['id'])
        assert c['debtBalance']==600
        return {'abono_CLP':400,'saldo_CLP':600}
    check('HTTP10','Abono de deuda','Saldo de 1000 a 600 CLP',pay)
    def audit():
        events=expect('/audit/history',token=ta)['events']
        assert len(events)>0
        expect('/audit/history',status=403,token=st)
        return {'eventos_visibles_owner':len(events),'seller_status':403}
    check('HTTP11','Consulta de auditoría por rol','Dueño obtiene eventos y vendedor recibe 403',audit)
    def logout():
        expect('/auth/logout',status=204,method='POST',token=st,data={})
        expect('/products',status=401,token=st)
        return {'sesion_revocada':True,'status':401}
    check('HTTP12','Revocación de sesión','401 después de cerrar sesión',logout)

try:
    main()
finally:
    result={'executed_at_utc':datetime.now(timezone.utc).isoformat(),'environment':'API HTTP local con MemoryRepository y datos sintéticos','commit':'ddb9956cf35cfb2035f62528299fd6bb2c9b7d5c','cases':records}
    (ROOT/'api_resultados.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
    print(json.dumps(result,ensure_ascii=False,indent=2))
