/* Run against the local demo API, never a production account.
   PLAYWRIGHT_MODULE may point to an existing Playwright installation. */
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.LOCALITO_TEST_URL || 'http://127.0.0.1:5173';
assert.match(new URL(base).hostname, /^(127\.0\.0\.1|localhost)$/);
const output = process.env.LOCALITO_TEST_OUTPUT || process.cwd();

(async () => {
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'chrome' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(12000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    async function login(email = 'juanita+vendedor@localito.demo', password = 'Duoc2026V') {
      await page.goto(base);
      await page.getByLabel('Correo', { exact: true }).fill(email);
      await page.getByLabel('Contraseña', { exact: true }).fill(password);
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      if (!email.includes('+vendedor')) await page.locator('.desktop-sidebar').getByRole('button', { name: 'Vender', exact: true }).click();
      await page.locator('.sale-products-panel').waitFor();
    }
    const stored = () => page.evaluate(() => {
      const session = JSON.parse(localStorage.getItem('localito-session'));
      const key = `localito-sales:v1:${encodeURIComponent(session.tenant.id)}:${encodeURIComponent(session.user.id)}`;
      return JSON.parse(localStorage.getItem(key));
    });
    await login();
    assert.equal(await page.locator('.sale-product-entry').count(), 60);
    while (await page.getByRole('button', { name: /^Mostrar más/ }).count()) await page.getByRole('button', { name: /^Mostrar más/ }).click();
    assert.ok(await page.locator('.sale-product-entry').count() > 120);
    await page.getByPlaceholder('Buscar producto, marca o código', { exact: true }).fill('Coca-Cola');
    assert.ok(await page.locator('.sale-product-entry').count() < 60);
    await page.getByPlaceholder('Buscar producto, marca o código', { exact: true }).fill('');
    assert.equal(await page.locator('.sale-product-entry').count(), 60);
    console.log('PASS: catalog pagination and filter reset');

    await page.locator('.sale-favorite').first().click();
    await page.locator('.sale-product-entry .product-button').first().click();
    await page.getByLabel('Descuento', { exact: true }).fill('100');
    await page.getByLabel('Nota de venta', { exact: true }).fill('Pedido Ana');
    await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    await page.getByRole('button', { name: 'Fiado', exact: true }).click();
    await page.getByLabel('Cliente para fiado').selectOption({ index: 1 });
    const first = (await stored()).active;
    assert.equal(first.items.length, 1);
    await page.reload();
    await page.locator('.ticket-list .row').waitFor();
    assert.equal(await page.getByLabel('Nota de venta', { exact: true }).inputValue(), 'Pedido Ana');
    assert.equal(await page.getByLabel('Descuento', { exact: true }).inputValue(), '100');
    assert.equal(await page.locator('.sale-favorite').first().getAttribute('aria-pressed'), 'true');
    assert.equal((await stored()).active.id, first.id);
    assert.equal((await stored()).active.customerId, first.customerId);
    assert.ok(first.customerId);
    await page.getByRole('button', { name: 'Inventario', exact: true }).click();
    await page.getByRole('button', { name: 'Vender', exact: true }).click();
    assert.equal(await page.getByLabel('Nota de venta', { exact: true }).inputValue(), 'Pedido Ana');
    console.log('PASS: ticket, metadata and favorites survive reload and navigation');

    await page.locator('.sale-session-tools').getByRole('button', { name: 'Dejar en espera', exact: true }).click();
    assert.equal((await stored()).held.length, 1);
    assert.equal((await stored()).active.items.length, 0);
    await page.locator('.sale-product-entry .product-button').nth(1).click();
    await page.getByLabel('Nota de venta', { exact: true }).fill('Pedido B');
    const second = (await stored()).active;
    await page.getByRole('button', { name: 'En espera (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Retomar', exact: true }).click();
    assert.equal((await stored()).active.id, first.id);
    assert.equal((await stored()).held[0].id, second.id);
    assert.equal(await page.getByLabel('Nota de venta', { exact: true }).inputValue(), 'Pedido Ana');
    await page.reload();
    await page.locator('.ticket-list .row').waitFor();
    assert.equal((await stored()).held[0].notes, 'Pedido B');
    console.log('PASS: hold/resume atomically swaps tickets and persists both');

    await page.screenshot({ path: path.join(output, 'sale-desktop.png') });
    assert.equal(await page.locator('.sale-product-entry img').evaluateAll(images => images.every(image => image.complete && image.naturalWidth > 0)), true);
    for (const width of [390, 320, 820]) {
      await page.setViewportSize({ width, height: 844 });
      await page.locator('.mobile-cart-summary').click();
      await page.locator('dialog[open]').waitFor();
      await page.keyboard.press('Shift+Tab');
      assert.equal(await page.evaluate(() => Boolean(document.activeElement.closest('dialog'))), true);
      assert.equal(await page.locator('dialog[open]').evaluate(dialog => dialog.scrollWidth <= dialog.clientWidth + 1), true);
      await page.getByLabel('Nota de venta', { exact: true }).fill('Pedido Ana');
      await page.screenshot({ path: path.join(output, `sale-mobile-${width}.png`) });
      await page.keyboard.press('Escape');
      await page.locator('dialog[open]').waitFor({ state: 'hidden' });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    }
    console.log('PASS: mobile checkout opens, traps keyboard focus and closes at 320/390/820px');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-checkout-action').click();
    await page.getByRole('button', { name: 'Tarjeta · terminal externo', exact: true }).click();
    assert.equal(await page.getByRole('button', { name: 'Confirmar pago y registrar venta', exact: true }).isDisabled(), true);
    await page.getByRole('checkbox').check();
    assert.equal(await page.getByRole('button', { name: 'Confirmar pago y registrar venta', exact: true }).isEnabled(), true);
    await page.getByLabel('Descuento', { exact: true }).fill('200');
    assert.equal(await page.getByRole('checkbox').isChecked(), false);
    await page.getByRole('button', { name: 'Efectivo', exact: true }).click();
    const responsePromise = page.waitForResponse(response => response.url().endsWith('/sales') && response.request().method() === 'POST');
    await page.getByRole('button', { name: /^Registrar venta ·/ }).click();
    const response = await responsePromise;
    assert.equal(response.ok(), true, await response.text());
    assert.equal(response.request().postDataJSON().idempotencyKey, first.id);
    await page.getByText('Comprobante listo', { exact: true }).waitFor();
    assert.equal((await stored()).active.items.length, 0);
    assert.equal((await stored()).active.discount, '');
    assert.equal((await stored()).held.length, 1);
    await page.screenshot({ path: path.join(output, 'sale-receipt-mobile.png') });
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('.mobile-ticket-dialog').evaluate(dialog => getComputedStyle(dialog).display), 'none');
    assert.equal(await page.locator('.print-area').isVisible(), true);
    await page.emulateMedia({ media: 'screen' });
    await page.reload();
    await page.locator('.sale-products-panel').waitFor();
    assert.equal((await stored()).active.items.length, 0);
    console.log('PASS: actual API checkout, external confirmation invalidation and completed draft cleanup');

    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.locator('.sale-product-entry .product-button').first().click();
    await page.route('**/sales', route => route.abort('internetdisconnected'));
    await page.getByRole('button', { name: /^Cobrar \$/ }).click();
    await page.getByRole('button', { name: /^Registrar venta ·/ }).click();
    await page.getByText(/Sin conexión: la operación quedó guardada/).waitFor();
    assert.equal((await stored()).active.items.length, 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('localito-offline-queue')).length), 1);
    await page.unroute('**/sales');
    await page.reload();
    await page.locator('.sale-products-panel').waitFor();
    assert.equal((await stored()).active.items.length, 0);
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('localito-offline-queue')).length), 0);
    console.log('PASS: queued sale is not restored as an editable ticket and syncs on reload');

    await page.locator('.sale-product-entry .product-button').first().click();
    await page.getByLabel('Nota de venta', { exact: true }).fill('Privado vendedor');
    const original = await stored();
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await login('juanita@localito.demo', 'Duoc2026');
    assert.equal(await page.locator('.ticket-list .row').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'En espera (0)', exact: true }).count(), 1);
    assert.equal(await page.locator('.sale-favorite[aria-pressed="true"]').count(), 0);
    await page.locator('.sale-product-entry .product-button').nth(2).click();
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await login('donpepe+vendedor@localito.demo', 'Duoc2026V');
    assert.equal(await page.locator('.ticket-list .row').count(), 0);
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await login();
    assert.deepEqual((await stored()).active, original.active);
    assert.deepEqual((await stored()).favorites, original.favorites);
    console.log('PASS: logout preserves draft; another user and business cannot see it');

    const heldProductId = (await stored()).held[0].items[0].productId;
    await page.route('**/bootstrap', async route => {
      const response = await route.fetch();
      const body = await response.json();
      const product = body.data.products.find(product => product.id === heldProductId);
      product.salePrice += 500;
      product.stock = 1;
      await route.fulfill({ response, json: body });
    });
    await page.reload();
    await page.locator('.sale-products-panel').waitFor();
    await page.getByRole('button', { name: 'En espera (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Retomar', exact: true }).click();
    assert.equal((await stored()).active.items[0].unitPrice, second.items[0].unitPrice + 500);
    await page.getByText(/precio actualizado/).waitFor();
    await page.unroute('**/bootstrap');
    console.log('PASS: resume recalculates prices from the current catalog');

    await page.getByRole('switch', { name: 'Cambiar entre modo claro y oscuro' }).click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('.mobile-cart-summary').click();
    await page.locator('dialog[open]').waitFor();
    await page.screenshot({ path: path.join(output, 'sale-mobile-dark.png') });
    await page.keyboard.press('Escape');
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.getByRole('button', { name: 'En espera (1)', exact: true }).click();
    await page.getByRole('button', { name: 'Descartar venta en espera', exact: true }).click();
    await page.getByRole('button', { name: 'Descartar', exact: true }).click();
    assert.equal((await stored()).held.length, 0);
    assert.equal(errors.length, 0, errors.join('\n'));
    console.log('PASS: explicit discard and no browser exceptions');
    await context.close();
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
