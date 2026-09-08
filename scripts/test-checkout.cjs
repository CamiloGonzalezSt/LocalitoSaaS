// Local demo only. All sale submissions are intercepted, never charged or saved.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(), 'output', 'checkout-qa');
fs.mkdirSync(out, { recursive: true });
(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [], writes = [];
    page.on('pageerror', error => errors.push(error.message));
    let product, fail = false;
    await page.route('**/bootstrap', async route => {
      const response = await route.fetch();
      const body = await response.json();
      product = { ...body.data.products[0], id: 'checkout-qa', name: 'Producto de prueba', salePrice: 1500, stock: 100 };
      body.data.products = [product];
      await route.fulfill({ response, json: body });
    });
    await page.route('**/sales', async route => {
      if (route.request().method() !== 'POST') return route.continue();
      const payload = route.request().postDataJSON();
      writes.push(payload);
      if (fail) return route.fulfill({ status: 500, json: { message: 'Error de prueba al guardar la venta.' } });
      const items = payload.items.map(item => ({ ...item, productName: product.name, unitPrice: 1500, subtotal: 1500 * item.quantity }));
      const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
      await route.fulfill({ json: { data: { ...payload, id: 'checkout-receipt-' + writes.length, tenantId: product.tenantId, sellerId: 'qa', items, subtotal,
        total: subtotal - (payload.discount || 0), status: 'active', paymentStatus: payload.paymentMethod === 'credit' ? 'pending' : 'approved',
        saleType: payload.paymentMethod === 'credit' ? 'credit' : 'normal', createdAt: new Date().toISOString() } } });
    });
    const base = process.env.LOCALITO_TEST_URL || 'http://127.0.0.1:5173';
    assert.ok(['127.0.0.1', 'localhost'].includes(new URL(base).hostname));
    await page.goto(base);
    await page.getByLabel('Correo', { exact: true }).fill('juanita@localito.demo');
    await page.getByLabel('Contraseña', { exact: true }).fill('Duoc2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.locator('.desktop-sidebar').getByRole('button', { name: 'Vender', exact: true }).click();
    const button = name => page.getByRole('button', { name, exact: true });
    const submit = () => button('Confirmar cobro');
    const start = async () => {
      await page.locator('.sale-product-entry .product-button').first().click();
      if (page.viewportSize().width < 960) await page.locator('.mobile-checkout-action').click();
      else await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    };
    const shot = async name => {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
        await page.waitForTimeout(150);
        await page.screenshot({ path: path.join(out, `${name}-${theme}.png`) });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' page overflow');
        assert.equal(await page.locator('#sale-ticket').evaluate(el => el.scrollWidth > el.clientWidth + 1), false, name + ' ticket overflow');
      }
    };
    await start();
    assert.equal(await page.getByRole('group', { name: 'Medios de pago', exact: true }).getByRole('button').count(), 3);
    assert.equal(await button('Webpay').count(), 0);
    await button('Más').click();
    await button('Webpay').click();
    await button('Más').click();
    assert.equal(await page.getByRole('group', { name: 'Pagos externos' }).count(), 0);
    await button('Efectivo').click();
    assert.equal(await submit().isDisabled(), true);
    await page.getByLabel('Efectivo recibido', { exact: true }).fill('1000');
    assert.equal(await submit().isDisabled(), true);
    assert.match(await page.locator('.checkout-change').innerText(), /Faltan.*500/s);
    await page.getByLabel('Efectivo recibido', { exact: true }).fill('2000.5');
    assert.equal(await submit().isDisabled(), true);
    await page.getByLabel('Efectivo recibido', { exact: true }).fill('2000');
    assert.match(await page.locator('.checkout-change').innerText(), /Vuelto.*500/s);
    await shot('cash-desktop');
    fail = true;
    await submit().click();
    await page.getByText('Error de prueba al guardar la venta.', { exact: true }).waitFor();
    assert.equal(await page.getByLabel('Efectivo recibido', { exact: true }).inputValue(), '2000');
    assert.equal(await page.locator('.ticket-list .row').count(), 1);
    fail = false;
    await submit().click();
    await page.locator('.checkout-complete').waitFor();
    assert.equal(writes[0].idempotencyKey, writes[1].idempotencyKey);
    assert.equal(writes[1].receivedCash, undefined, 'Tender must not inflate payment payload');
    assert.match(await page.locator('.checkout-receipt-lines').innerText(), /Recibido.*2.000.*Vuelto.*500/s);
    await shot('receipt-desktop');
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.print-area').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await button('Nueva venta').click();
    assert.equal(await page.locator('.checkout-complete').count(), 0);
    await start();
    for (const method of ['Tarjeta', 'Transferencia', 'Webpay', 'Mercado Pago']) {
      if (method === 'Webpay') await button('Más').click();
      await button(method).click();
      assert.equal(await submit().isDisabled(), true, method);
      await page.locator('.checkout-verification input').check();
      assert.equal(await submit().isEnabled(), true, method);
    }
    await button('Transferencia').click();
    await page.locator('.checkout-verification input').check();
    await button('Volver al ticket').click();
    await page.getByLabel('Descuento', { exact: true }).fill('100');
    await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    assert.equal(await page.locator('.checkout-verification input').isChecked(), false);
    await page.locator('.checkout-verification input').check();
    await submit().click();
    await page.locator('.checkout-complete').waitFor();
    assert.equal(writes.at(-1).paymentMethod, 'transfer');
    assert.equal(writes.at(-1).discount, 100);
    await button('Nueva venta').click();
    await start();
    await button('Pago mixto').click();
    await button('Volver al ticket').click();
    await page.locator('.sale-session-tools').getByRole('button', { name: 'Dejar en espera', exact: true }).click();
    await button('En espera (1)').click();
    await button('Retomar').click();
    await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    assert.equal(await button('Pago mixto').getAttribute('aria-pressed'), 'true');
    for (const value of ['0', '-1', '1500', '1600', '500.5']) {
      await page.getByLabel('Parte en efectivo', { exact: true }).fill(value);
      assert.equal(await submit().isDisabled(), true, 'mixed ' + value);
    }
    await page.getByLabel('Parte en efectivo', { exact: true }).fill('500');
    await page.locator('.checkout-verification input').check();
    await button('Volver al ticket').click();
    await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    assert.equal(await page.locator('.checkout-verification input').isChecked(), false);
    await page.locator('.checkout-verification input').check();
    await shot('mixed-desktop');
    await submit().click();
    await page.locator('.checkout-complete').waitFor();
    assert.deepEqual(writes.at(-1).payments, [{ method: 'cash', amount: 500 }, { method: 'card', amount: 1000 }]);
    await button('Nueva venta').click();
    await start();
    await button('Fiado').click();
    assert.equal(await button('Registrar fiado').isDisabled(), true);
    await page.getByLabel('Cliente para fiado').selectOption({ index: 1 });
    assert.equal(await button('Registrar fiado').isEnabled(), true);
    await button('Registrar fiado').click();
    await page.getByRole('heading', { name: 'Fiado registrado', exact: true }).waitFor();
    assert.ok(writes.at(-1).customerId);
    await button('Nueva venta').click();
    for (const width of [390, 320, 820]) {
      await page.setViewportSize({ width, height: 900 });
      await start();
      await button('Monto exacto').click();
      await shot('cash-' + width);
      await button('Transferencia').click();
      await shot('transfer-' + width);
      await button('Pago mixto').click();
      await page.getByLabel('Parte en efectivo', { exact: true }).fill('500');
      await shot('mixed-' + width);
      await page.locator('.checkout-verification input').check();
      await submit().click();
      await page.locator('.checkout-complete').waitFor();
      await shot('receipt-' + width);
      await button('Nueva venta').click();
      assert.equal(await page.locator('dialog[open]').count(), 0);
    }
    assert.deepEqual(errors, []);
    console.log('PASS: cash/change, insufficient and fractional amounts, failure/retry with same idempotency key, external confirmation reset, split payments, credit customer, new sale and 30 desktop/mobile theme screenshots. All sale writes mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
