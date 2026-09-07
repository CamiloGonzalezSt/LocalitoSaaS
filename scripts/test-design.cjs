// Local demo login; all product/customer writes below are intercepted fixtures.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const out = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(), 'output', 'design-qa');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let products, customers, stockFailure = true, writes = [];
    await page.route('**/bootstrap', async route => {
      const response = await route.fetch();
      const body = await response.json();
      products ??= [
        { ...body.data.products[0], id: 'qa-product', name: 'Producto prueba larga de inventario', salePrice: 1500, costPrice: 900, stock: 2.5, minimumStock: 3, trackStock: true },
        { ...body.data.products[0], id: 'qa-untracked', name: 'Servicio sin control de stock', salePrice: 2500, stock: 0, trackStock: false }
      ];
      customers ??= body.data.customers;
      body.data.products = products;
      body.data.customers = customers;
      await route.fulfill({ response, json: body });
    });
    await page.route(/\/(products|customers)(\/[^?]*)?$/, async route => {
      const request = route.request();
      if (request.method() === 'GET') return route.continue();
      const url = new URL(request.url());
      const payload = request.postDataJSON();
      writes.push({ path: url.pathname, payload });
      let result;
      if (url.pathname.endsWith('/stock')) {
        if (stockFailure) return route.fulfill({ status: 500, json: { message: 'No se pudo guardar el stock de prueba.' } });
        products[0] = { ...products[0], stock: payload.quantity };
        result = products[0];
      } else if (url.pathname === '/products/qa-product') {
        products[0] = { ...products[0], ...payload };
        result = products[0];
      } else if (url.pathname === '/products') {
        result = { ...products[0], ...payload, id: 'qa-new' };
        products.push(result);
      } else if (url.pathname === '/customers') {
        result = { ...customers[0], ...payload, id: 'qa-customer' };
        customers.push(result);
      } else throw new Error('Unexpected write: ' + url.pathname);
      await route.fulfill({ json: { data: result } });
    });
    const shot = async name => {
      for (const theme of ['light', 'dark']) {
        await page.evaluate(theme => { document.documentElement.dataset.theme = theme; }, theme);
        await page.waitForTimeout(250);
        await page.screenshot({ path: path.join(out, `${name}-${theme}.png`) });
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, name + ' overflow');
      }
    };
    const nav = name => page.locator('.desktop-sidebar').getByRole('button', { name, exact: true }).click();
    await page.goto('http://127.0.0.1:5173');
    await page.getByLabel('Correo', { exact: true }).fill('juanita@localito.demo');
    await page.getByLabel('Contraseña', { exact: true }).fill('Duoc2026');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.locator('.home-workspace').waitFor();
    await nav('Inventario');
    await page.getByRole('button', { name: 'Agregar producto', exact: true }).click();
    const productForm = page.getByRole('form', { name: 'Datos del producto' });
    await page.getByLabel('Categoría', { exact: true }).fill('');
    await productForm.getByRole('button', { name: 'Crear producto', exact: true }).click();
    assert.equal(writes.length, 0);
    await page.waitForFunction(() => document.querySelectorAll('.product-form-panel [aria-invalid="true"]').length === 3, null, { timeout: 2500 }).catch(async error => {
      console.log(await productForm.locator('input').evaluateAll(inputs => inputs.map(input => ({ value: input.value, required: input.required, valid: input.validity.valid, error: input.getAttribute('aria-invalid') }))));
      await page.screenshot({ path: path.join(out, 'validation-failure.png') });
      throw error;
    });
    assert.equal(await page.evaluate(() => document.activeElement.id), await page.getByLabel('Nombre del producto', { exact: true }).getAttribute('id'));
    await shot('product-errors');
    for (const width of [390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await shot('product-errors-' + width);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.getByLabel('Nombre del producto', { exact: true }).fill('Producto QA');
    await page.getByLabel('Categoría', { exact: true }).fill('Pruebas');
    await page.getByLabel('Precio de venta', { exact: true }).fill('-10');
    await productForm.getByRole('button', { name: 'Crear producto', exact: true }).click();
    assert.equal(writes.length, 0);
    await page.getByLabel('Precio de venta', { exact: true }).fill('1900');
    await page.getByLabel('Stock inicial', { exact: true }).fill('2.5');
    await productForm.locator('summary').click();
    await page.getByLabel('Costo', { exact: true }).fill('-1');
    await productForm.locator('summary').click();
    await productForm.getByRole('button', { name: 'Crear producto', exact: true }).click();
    assert.equal(await productForm.locator('details').getAttribute('open'), '');
    assert.equal(writes.length, 0);
    await page.getByLabel('Costo', { exact: true }).fill('900');
    await page.getByLabel('Nombre del producto', { exact: true }).press('Enter');
    await page.waitForFunction(() => document.querySelector('.app-snackbar')?.textContent.includes('Producto creado'));
    assert.equal(writes[0].payload.stock, 2.5);
    await nav('Clientes');
    const customerForm = page.getByRole('form', { name: 'Datos del cliente' });
    await customerForm.getByRole('button', { name: 'Crear cliente', exact: true }).click();
    assert.equal(writes.length, 1);
    await page.getByLabel('Nombre completo', { exact: true }).fill('Cliente QA');
    await customerForm.locator('summary').click();
    await page.getByLabel('Correo (opcional)', { exact: true }).fill('incorrecto');
    await customerForm.getByRole('button', { name: 'Crear cliente', exact: true }).click();
    assert.equal(writes.length, 1);
    await shot('customer-errors');
    await page.getByLabel('Correo (opcional)', { exact: true }).fill('cliente@example.test');
    await customerForm.getByRole('button', { name: 'Crear cliente', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('.app-snackbar')?.textContent.includes('Cliente creado'));
    await nav('Inventario');
    const row = page.locator('.ui-inventory-row').first();
    assert.match(await page.locator('.ui-inventory-row').nth(1).innerText(), /Sin control/);
    await row.getByRole('button', { name: /Edición rápida/ }).click();
    const editor = row.getByRole('form');
    await editor.getByLabel(/Precio de/).fill('1700');
    await editor.getByLabel(/Stock de/).fill('3.5');
    await editor.getByRole('button', { name: /Guardar cambios/ }).click();
    await editor.getByRole('alert').waitFor();
    assert.equal(await editor.getByLabel(/Stock de/).inputValue(), '3.5');
    await shot('quick-edit-error');
    stockFailure = false;
    await editor.getByRole('button', { name: /Guardar cambios/ }).click();
    await editor.waitFor({ state: 'hidden' });
    assert.match(await row.locator('.inventory-stock').innerText(), /3.5/);
    for (const width of [1440, 1024, 820, 390, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await row.locator('.inventory-price').isVisible(), true);
      assert.equal(await row.locator('.inventory-cost').isVisible(), true);
      assert.equal(await row.locator('.inventory-stock').isVisible(), true);
      await row.evaluate(element => element.scrollIntoView({ block: 'center' }));
      await shot('inventory-' + width);
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await nav('Configuración');
    const profile = page.getByRole('form', { name: 'Mi perfil' });
    await profile.getByLabel('Correo', { exact: true }).fill('no-es-correo');
    await profile.getByRole('button', { name: 'Guardar mi perfil', exact: true }).click();
    assert.equal(await profile.getByLabel('Correo', { exact: true }).getAttribute('aria-invalid'), 'true');
    await shot('settings-errors');
    await nav('Inventario');
    await page.getByRole('button', { name: 'Ingresar factura', exact: true }).click();
    await page.locator('.invoice-ai-panel').waitFor();
    await nav('Inventario');
    const sellerContext = await browser.newContext({ viewport: { width: 390, height: 900 }, serviceWorkers: 'block' });
    const seller = await sellerContext.newPage();
    await seller.goto('http://127.0.0.1:5173');
    await seller.getByLabel('Correo', { exact: true }).fill('juanita+vendedor@localito.demo');
    await seller.getByLabel('Contraseña', { exact: true }).fill('Duoc2026V');
    await seller.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await seller.locator('.nav-item').filter({ hasText: 'Inventario' }).click();
    await seller.locator('.ui-inventory-row').first().waitFor();
    assert.equal(await seller.locator('.ui-inventory-row input[type="checkbox"]').count(), 0);
    assert.equal(await seller.locator('.ui-inventory-row button').count(), 0);
    assert.equal(await seller.locator('.inventory-price').first().isVisible(), true);
    await sellerContext.close();
    assert.deepEqual(errors, []);
    console.log('PASS: required/numeric/email validation, focus, collapsed fields, Enter submit, retained edits on failure, retry, decimal stock, mobile data visibility, seller read-only view, invoice navigation and 22 theme screenshots. All writes mocked.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
