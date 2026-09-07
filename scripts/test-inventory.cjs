// Browser QA uses intercepted fixtures. It does not create products or orders in the demo API.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(), 'output', 'inventory-qa');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let proposalRequest = null;
    await page.route('**/bootstrap', async route => {
      const response = await route.fetch();
      const body = await response.json();
      const d = body.data;
      const base = { ...d.products[0], active: true, category: 'QA', trackStock: true, minimumStock: 3, costPrice: 700, salePrice: 1000, stock: 10, expiryDate: undefined };
      d.products = [
        { ...base, id: 'out', name: 'Agotado inventario QA', stock: 0 },
        { ...base, id: 'low', name: 'Bajo inventario QA', stock: 1 },
        ...Array.from({ length: 64 }, (_, i) => ({ ...base, id: `ok-${i}`, name: `Producto normal QA ${i}` }))
      ];
      d.suppliers = [{ id: 'supplier-qa', name: 'Proveedor QA' }];
      d.purchaseOrders = [];
      await route.fulfill({ response, json: body });
    });
    await page.route('**/purchases', async route => {
      if (route.request().method() === 'POST') {
        proposalRequest = JSON.parse(route.request().postData() || '{}');
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ data: { id: 'purchase-qa' } }) });
      } else await route.continue();
    });
    await page.route('**/suppliers', async route => {
      if (route.request().method() === 'GET') await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'supplier-qa', name: 'Proveedor QA' }] }) });
      else await route.continue();
    });
    await page.goto('http://127.0.0.1:5173');
    await page.getByLabel('Correo', { exact: true }).fill('juanita@localito.demo');
    await page.getByLabel('Contraseña', { exact: true }).fill('Duoc2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.locator('.home-workspace').waitFor();
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Inventario', exact: true }).click();
    await page.getByPlaceholder('Buscar producto, marca o código').waitFor();
    assert.equal(await page.locator('.inventory-compact-row').count(), 60);
    assert.equal(await page.locator('.inventory-table-header').count(), 1);
    await page.getByRole('button', { name: 'Mostrar más', exact: true }).click();
    assert.equal(await page.locator('.inventory-compact-row').count(), 66);
    const first = page.locator('.inventory-compact-row').first();
    await first.getByRole('checkbox').check();
    await page.locator('.inventory-compact-row').nth(1).getByRole('checkbox').check();
    assert.match(await page.locator('.inventory-bulk-bar').innerText(), /2 productos seleccionados/);
    await page.getByRole('button', { name: 'Proponer reposición', exact: true }).click();
    assert.equal(await page.locator('.inventory-proposal-line').count(), 2);
    await page.locator('.inventory-proposal-line').first().getByRole('spinbutton').fill('9');
    assert.equal(await page.locator('.inventory-proposal-line').first().getByRole('spinbutton').inputValue(), '9');
    await page.getByRole('button', { name: 'Revisar en Compras', exact: true }).click();
    await page.getByRole('heading', { name: 'Qué comprar' }).waitFor();
    assert.equal(await page.locator('.purchase-proposal-review').count(), 1);
    assert.equal(await page.locator('.purchase-proposal-lines .row').count(), 2);
    await page.locator('.purchase-proposal-lines select').count().catch(() => 0);
    await page.getByRole('button', { name: 'Convertir en orden de compra', exact: true }).click();
    await page.waitForTimeout(250);
    assert.equal(proposalRequest.items.length, 2);
    assert.equal(proposalRequest.items[0].quantity, 9);
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Inventario', exact: true }).click();
    assert.equal(await page.locator('.inventory-proposal').count(), 0);
    const quick = page.locator('.inventory-compact-row').first();
    await quick.getByRole('button', { name: /Edición rápida de/ }).click();
    await quick.getByRole('spinbutton', { name: /Precio de/ }).fill('1200');
    await quick.getByRole('spinbutton', { name: /Stock de/ }).fill('11');
    assert.equal(await quick.getByRole('button', { name: /Guardar cambios de/ }).count(), 1);
    for (const width of [1440, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.screenshot({ path: path.join(output, `inventory-${width}-${theme}.png`), fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width} ${theme}`);
      }
    }
    assert.deepEqual(errors, []);
    console.log('PASS: compact inventory, 60-item pagination, multi-select, editable replenishment, purchase handoff, proposal cleanup, quick edit, 8 responsive/theme views. No writes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
