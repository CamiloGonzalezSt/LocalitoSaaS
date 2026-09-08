const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LOCALITO_TEST_URL || 'http://127.0.0.1:43200';
const apiBase = process.env.LOCALITO_TEST_API || 'http://127.0.0.1:43201';
for (const url of [base, apiBase]) assert.ok(['127.0.0.1', 'localhost'].includes(new URL(url).hostname));
const out = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(), 'output', 'hardening-qa');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage(); page.setDefaultTimeout(15000);
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    const email = `qa-hardening-${Date.now()}@localito.test`, password = 'TestingLocalito2026';
    const registration = await context.request.post(apiBase + '/auth/register', { data: { businessName: 'Pruebas de confiabilidad', businessType: 'QA', ownerName: 'QA', email, password } });
    assert.equal(registration.ok(), true, await registration.text());
    const auth = (await registration.json()).data, headers = { Authorization: `Bearer ${auth.token}` };
    async function request(route, method = 'get', data) {
      const response = await context.request[method](apiBase + route, { headers, data });
      assert.equal(response.ok(), true, route + ': ' + await response.text());
      return (await response.json()).data;
    }
    const product = await request('/products', 'post', { name: 'Producto historico QA', category: 'QA', salePrice: 1000, stock: 10 });
    const valid = { paymentMethod: 'cash', items: [{ productId: product.id, quantity: 1 }] };
    for (const data of [{ ...valid, items: [{ productId: product.id, quantity: -1 }] }, { ...valid, items: [...valid.items, ...valid.items] }, { ...valid, paymentMethod: 'mixed' }, { ...valid, discount: 1001 }]) {
      const response = await context.request.post(apiBase + '/sales', { headers, data });
      assert.equal(response.status(), 400, await response.text());
    }
    assert.equal((await request('/bootstrap')).products[0].stock, 10);
    await request(`/products/${product.id}`, 'patch', { salePrice: 1100, reason: 'Cambio historico verificable' });
    for (let i = 0; i < 105; i++) await request(`/products/${product.id}`, 'patch', { name: `Producto QA ${i}`, reason: `Revision QA ${i}` });
    const old = await request('/audit/history?search=Cambio%20historico');
    assert.equal(old.events.length, 1);
    assert.deepEqual(old.events[0].details.before, { salePrice: 1000, stock: 10 });
    assert.deepEqual(old.events[0].details.after, { salePrice: 1100, stock: 10 });
    const seen = new Set(); let cursor;
    do {
      const chunk = await request('/audit/history?limit=25' + (cursor ? `&cursor=${cursor}` : ''));
      for (const event of chunk.events) { assert.equal(seen.has(event.id), false); seen.add(event.id); }
      cursor = chunk.nextCursor;
    } while (cursor);
    assert.ok(seen.size > 100);
    const invalidFilter = await context.request.get(apiBase + '/audit/history?from=bad', { headers });
    assert.equal(invalidFilter.status(), 400);
    await page.goto(base);
    await page.getByLabel('Correo', { exact: true }).fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.locator('.desktop-sidebar').waitFor();
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Caja', exact: true }).click();
    const history = page.getByRole('region', { name: 'Historial de cambios', exact: true });
    await history.getByRole('button', { name: 'Mostrar más eventos', exact: true }).click();
    await page.waitForFunction(() => document.querySelectorAll('.audit-event').length === 50);
    await history.getByLabel('Buscar usuario o producto', { exact: true }).fill('Cambio historico');
    await page.waitForFunction(() => document.querySelectorAll('.audit-event').length === 1);
    await history.locator('summary').click();
    assert.match(await history.innerText(), /Precio: 1000.*Precio: 1100/s);
    async function shots(name, locator) {
      for (const width of [1440, 390, 320]) for (const theme of ['light', 'dark']) {
        await page.setViewportSize({ width, height: 1000 });
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await locator.scrollIntoViewIfNeeded(); await page.waitForTimeout(120);
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${name}-${width} overflow`);
        await page.screenshot({ path: path.join(out, `${name}-${width}-${theme}.png`) });
      }
    }
    await shots('full-history', history);
    await page.evaluate(async productId => {
      const module = await import('/src/lib/offline.ts');
      for (const [id, quantity] of [['stock-rejected', 1000], ['valid-pending', 1]]) await module.enqueueSale(module.syncScope(), JSON.stringify({ idempotencyKey: id, paymentMethod: 'cash', items: [{ productId, quantity }] }));
    }, product.id);
    await page.getByRole('button', { name: '2 ventas pendientes', exact: true }).click();
    const sync = page.getByRole('region', { name: 'Sincronización', exact: true });
    await sync.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await page.getByRole('button', { name: '1 venta pendiente', exact: true }).waitFor();
    assert.equal((await request('/bootstrap')).sales.length, 1);
    await sync.locator('summary').click();
    assert.match(await sync.innerText(), /Stock insuficiente/);
    const downloadPromise = page.waitForEvent('download');
    await sync.getByRole('button', { name: 'Descargar respaldo de ventas pendientes', exact: true }).click();
    const download = await downloadPromise;
    const backupPath = path.join(out, download.suggestedFilename());
    await download.saveAs(backupPath);
    const backup = fs.readFileSync(backupPath, 'utf8');
    assert.ok(backup.includes('stock-rejected'));
    assert.equal(backup.includes(auth.token), false);
    await shots('rejected-sync', sync);
    await request(`/products/${product.id}/stock`, 'patch', { quantity: 2000, reason: 'Reposicion de prueba' });
    await sync.getByRole('button', { name: 'Reintentar esta venta', exact: true }).click();
    await page.getByRole('button', { name: 'Sin pendientes', exact: true }).waitFor();
    assert.equal((await request('/bootstrap')).sales.length, 2);
    const seller = await request('/users', 'post', { name: 'QA Seller', email: `seller-${Date.now()}@localito.test`, role: 'seller', password });
    const login = await context.request.post(apiBase + '/auth/login', { data: { email: seller.email, password } });
    const sellerToken = (await login.json()).data.token;
    const denied = await context.request.get(apiBase + '/audit/history', { headers: { Authorization: `Bearer ${sellerToken}` } });
    assert.equal(denied.status(), 403);
    assert.deepEqual(errors, []);
    console.log('PASS: invalid sale HTTP 400 without mutations, historical before/after, cursor pagination >100 events, search and permissions, rejected sale isolation, local backup without token, individual retry and 12 responsive/theme screenshots.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
