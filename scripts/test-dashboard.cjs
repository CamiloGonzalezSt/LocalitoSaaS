// Local owner demo only. Fixtures intercept bootstrap; no business data is changed.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(), 'output', 'dashboard-qa');
fs.mkdirSync(output, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let mode = 'open';
    await page.route('**/bootstrap', async route => {
      const response = await route.fetch();
      const body = await response.json();
      const d = body.data;
      const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Santiago' }).format(new Date());
      const base = { ...d.products[0], minimumStock: 3, trackStock: true, active: true, expiryDate: undefined };
      d.products = [
        { ...base, id: 'out', name: 'Agotado QA', stock: 0 },
        { ...base, id: 'low', name: 'Reponer QA', stock: 2 },
        { ...base, id: 'expired', name: 'Vencido QA', stock: 8, expiryDate: '2020-01-01' },
        { ...base, id: 'expiring', name: 'Vence hoy QA', stock: 8, expiryDate: today },
        ...Array.from({ length: 65 }, (_, i) => ({ ...base, id: `ok${i}`, name: `Normal QA ${i}`, stock: 10 }))
      ];
      d.customers = [{ ...d.customers[0], id: 'overdue', name: 'Cliente vencido QA', debtBalance: 5000 }, { ...d.customers[0], id: 'future', name: 'Cliente al dia QA', debtBalance: 3000 }];
      d.debts = [{ id: 'd1', customerId: 'overdue', balance: 1000, status: 'pending', dueDate: '2020-01-01' }, { id: 'd2', customerId: 'overdue', balance: 1000, status: 'overdue', dueDate: '2020-01-01' }, { id: 'd3', customerId: 'future', balance: 3000, status: 'pending', dueDate: '2099-01-01' }];
      d.cashSession = mode === 'open' ? { id: 's1', status: 'open', openedAt: '2026-09-04T23:00:00Z', openingAmount: 10000, openedByName: 'Operador QA' } : undefined;
      d.cashRegister = { ...d.cashRegister, grossTotal: 12000, receivedTotal: 10000, creditTotal: 2000, salesCount: 7, averageTicket: 1714, expectedCash: 0, openingAmount: 10000, cashDeposits: 0, cashWithdrawals: 16000, totalsByMethod: { cash: 6000, card: 4000, transfer: 0, credit: 2000, mixed: 0, webpay: 0, mercadopago: 0 } };
      d.sales = ['cash', 'card', 'transfer', 'webpay', 'mercadopago', 'credit', 'mixed'].map((method, i) => ({ id: `sale${i}`, items: [{ productId: 'low', productName: `Venta QA ${i}`, quantity: 2, unitPrice: 1000, subtotal: 2000 }], total: 2000, paymentMethod: method, payments: [{ method: method === 'mixed' ? 'cash' : method, amount: 2000 }], status: 'active', createdAt: `2026-09-05T${String(10 + i).padStart(2, '0')}:00:00Z` }));
      d.sales.push({ ...d.sales[0], id: 'cancelled', status: 'cancelled', createdAt: '2099-01-01T00:00:00Z' });
      if (mode === 'empty') { d.products = []; d.sales = []; d.debts = []; d.customers = []; d.summary.pendingDebt = 0; d.cashRegister = { ...d.cashRegister, grossTotal: 0, receivedTotal: 0, creditTotal: 0, salesCount: 0, averageTicket: 0, openingAmount: 0, cashWithdrawals: 0, totalsByMethod: { cash: 0 } }; }
      if (mode === 'locked') d.subscription.status = 'expired';
      await route.fulfill({ response, json: body });
    });
    await page.goto('http://127.0.0.1:5173');
    await page.getByLabel('Correo', { exact: true }).fill('juanita@localito.demo');
    await page.getByLabel('Contraseña', { exact: true }).fill('Duoc2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.locator('.home-workspace').waitFor();
    assert.match(await page.locator('.home-status').innerText(), /Caja abierta/);
    assert.match(await page.locator('.home-cash-total strong').innerText(), /\$0/);
    assert.equal(await page.locator('.presentation-guide').count(), 0);
    assert.equal(await page.locator('.home-sale').count(), 6);
    assert.match(await page.locator('.home-sale').first().innerText(), /Venta QA 6[\s\S]*Pago mixto/);
    await page.locator('.home-sale summary').first().click();
    assert.equal(await page.locator('.home-sale[open] li').count(), 1);
    const home = async () => { await page.locator('.desktop-sidebar').getByRole('button', { name: 'Inicio', exact: true }).click(); };
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Inventario', exact: true }).click();
    await page.getByPlaceholder('Buscar producto, marca o código').fill('sin coincidencias');
    await home();
    for (const [alert, filter, count] of [['Sin stock', 'Sin stock', 1], ['Stock bajo', 'Stock bajo', 2], ['Vencidos', 'Vencidos', 1], ['Por vencer', 'Por vencer (30 días)', 1]]) {
      await page.locator('.home-alert').filter({ hasText: alert }).click();
      assert.equal(await page.getByRole('button', { name: filter, exact: true }).getAttribute('aria-pressed'), 'true');
      assert.match(await page.locator('.inventory-strip').innerText(), new RegExp(`Visibles\\s+${count}`));
      await home();
    }
    await page.locator('.home-alert').filter({ hasText: 'Fiado vencido' }).click();
    assert.equal(await page.locator('.customer-row').count(), 1);
    assert.match(await page.locator('.customer-row').innerText(), /Cliente vencido QA/);
    await home();
    await page.locator('.home-business-summary button').first().click();
    assert.equal(await page.locator('.stock-list .product-row').count(), 60);
    await page.getByRole('button', { name: /Mostrar más \(60 de 69\)/ }).click();
    assert.equal(await page.locator('.stock-list .product-row').count(), 69);
    await home();
    for (const width of [1440, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.waitForTimeout(300);
        await page.screenshot({ path: path.join(output, `home-${width}-${theme}.png`), fullPage: true });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `overflow ${width} ${theme}`);
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    mode = 'closed'; await page.reload(); await page.locator('.home-workspace').waitFor();
    assert.match(await page.locator('.home-status').innerText(), /Sin turno abierto/);
    mode = 'locked'; await page.reload(); await page.locator('.home-workspace').waitFor();
    assert.equal(await page.locator('.home-heading button').isDisabled(), true);
    assert.equal(await page.locator('.home-shift-heading button').isEnabled(), true);
    mode = 'empty'; await page.reload();
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Inicio', exact: true }).click();
    await page.locator('.home-empty').waitFor();
    assert.equal(await page.locator('.home-alert').count(), 0);
    await page.screenshot({ path: path.join(output, 'home-empty.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: turn state, zero cash, filtered alerts, stale search reset, overdue customers, pagination, ordered sales, receipt, locked subscription, empty state, 8 responsive/theme views. No writes.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
