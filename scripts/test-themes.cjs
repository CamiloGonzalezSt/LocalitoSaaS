// Run with the local demo API and web server. PLAYWRIGHT_MODULE can point to
// an existing installation. Screenshots and audit.json go to LOCALITO_TEST_OUTPUT.
// No admin login or catalog mutation is performed; AI results are test fixtures.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const output = process.env.LOCALITO_TEST_OUTPUT || path.join(process.cwd(),'output','theme-qa');
fs.mkdirSync(output,{recursive:true});
async function audit(page, name, theme) {
  await page.evaluate(theme => {document.documentElement.dataset.theme = theme; document.documentElement.style.colorScheme = theme;}, theme);
  await page.waitForTimeout(220);
  const result = await page.evaluate(() => {
    const rgb = value => {
      const channels=(value.match(/[\d.]+/g) || []).map(Number);
      return value.startsWith('color(srgb ') ? channels.map((channel,index)=>index<3?channel*255:channel) : channels;
    };
    const light = ([r,g,b]) => [r,g,b].map(x => x/255).map(x => x<=.04045 ? x/12.92 : ((x+.055)/1.055)**2.4).reduce((sum,x,i) => sum+x*[.2126,.7152,.0722][i],0);
    const bgFor = el => {
      for(let e=el;e;e=e.parentElement) {const style=getComputedStyle(e); const bg=rgb(style.backgroundColor); if(style.backgroundImage!=='none') return {color:bg,gradient:true}; if(bg.length===3 || bg[3]>=.95) return {color:bg,gradient:false};}
      return {color:[255,255,255],gradient:false};
    };
    const bright=[]; const low=[];
    for(const el of document.querySelectorAll('body *')) {
      if(el.closest('svg,.print-area,.desktop-sidebar,.login-story') || !el.getClientRects().length || !el.checkVisibility()) continue;
      const style=getComputedStyle(el), rect=el.getBoundingClientRect();
      if(style.visibility==='hidden' || style.display==='none' || !rect.width || !rect.height) continue;
      const bg=rgb(style.backgroundColor);
      const label=el.className || el.tagName;
      if((bg.length===3 || bg[3]>.95) && light(bg)>.7 && rect.width>55 && rect.height>35) bright.push({label,bg:style.backgroundColor,text:el.textContent.trim().slice(0,65)});
      const directText=[...el.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent.trim()).join('');
      if(!directText || el.closest(':disabled') || +style.opacity<.8) continue;
      const back=bgFor(el); if(back.gradient) continue;
      const foreground=light(rgb(style.color)), background=light(back.color);
      const ratio=(Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05);
      const large=parseFloat(style.fontSize)>=24 || (parseFloat(style.fontSize)>=18.66 && +style.fontWeight>=700);
      if(ratio < (large?3:4.5)) low.push({label,text:directText.slice(0,65),ratio:+ratio.toFixed(2),color:style.color,bg:back.color});
    }
    const unique=items=>[...new Map(items.map(item=>[item.label+'|'+(item.color||item.bg),item])).values()];
    return {bright:unique(bright),low:unique(low),overflow:document.documentElement.scrollWidth>innerWidth};
  });
  await page.screenshot({path:path.join(output,`${name}-${theme}.png`)});
  return {name,theme,...result};
}
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try {
  const context=await browser.newContext({viewport:{width:1440,height:1000},serviceWorkers:'block'});
  const page=await context.newPage(); page.setDefaultTimeout(10000);
  await page.goto('http://127.0.0.1:5173');
  const report=[];
  for(const theme of ['light','dark']) report.push(await audit(page,'login',theme));
  await page.getByLabel('Correo',{exact:true}).fill('juanita@localito.demo');
  await page.getByLabel('Contraseña',{exact:true}).fill('Duoc2026');
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
  await page.locator('.dashboard-stack').waitFor();
  for(const name of ['Inicio','Vender','Inventario','Clientes','Caja','Reportes','Buscar']) {
   await page.locator('.desktop-sidebar').getByRole('button',{name,exact:true}).click();
   for(const theme of ['light','dark']) report.push(await audit(page,name,theme));
  }
  const capture = async name => {for(const theme of ['light','dark']) report.push(await audit(page,name,theme));};
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Configuración',exact:true}).click();
  await capture('settings');
  await page.locator('.more-links').getByRole('button',{name:/^Mi plan/}).click();
  await capture('plan');
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Inventario',exact:true}).click();
  await page.getByRole('button',{name:/Agregar producto/}).click();
  await capture('product-form');
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Inventario',exact:true}).click();
  await page.getByRole('button',{name:/Cargar varios/}).click();
  await capture('setup');
  await page.getByRole('button',{name:/Importar una plantilla CSV/}).click();
  await capture('csv');
  await page.locator('.bulk-import-panel input[type="file"]').setInputFiles({name:'theme-preview.csv',mimeType:'text/csv',buffer:Buffer.from('nombre,precio,stock\nProducto de prueba,1500,3\nProducto incorrecto,-50,2')});
  await page.locator('.bulk-preview-table').waitFor();
  await capture('csv-preview');
  await page.getByRole('button',{name:'Ver otras formas de carga'}).click();
  await page.getByRole('button',{name:/Fotografiar facturas/}).click();
  await capture('invoice');
  await page.route('**/ai/invoices/analyze', route=>route.fulfill({json:{data:{supplierName:'Proveedor de prueba',invoiceNumber:'QA-1',invoiceDate:'2026-09-05',total:2000,items:[{id:'qa-line',rawDescription:'Arroz de prueba',name:'Arroz de prueba',category:'Abarrotes',quantity:2,unitCost:1000,lineTotal:2000,confidence:.6}],warnings:['Revisa las cantidades antes de confirmar.']}}}));
  await page.locator('.invoice-capture input[type="file"]').setInputFiles({name:'fixture.png',mimeType:'image/png',buffer:await page.locator('.invoice-capture').screenshot()});
  await page.locator('.invoice-line').waitFor();
  await capture('invoice-preview');
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Vender',exact:true}).click();
  await page.getByRole('button',{name:'Venta Rápida con foto',exact:true}).click();
  await capture('quick-sale');
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Vender',exact:true}).click();
  await page.locator('.sale-product-entry .product-button').first().click();
  await page.getByRole('button',{name:/^Cobrar \$/}).click();
  await page.getByRole('button',{name:'Tarjeta · terminal externo',exact:true}).click();
  await capture('checkout');
  for(const width of [390,320,820]) {
    await page.setViewportSize({width,height:844});
    await page.locator('.mobile-checkout-action').click();
    await page.locator('dialog[open]').waitFor();
    await capture(`checkout-mobile-${width}`);
    await page.keyboard.press('Escape');
    await capture(`catalog-mobile-${width}`);
  }
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('.desktop-sidebar').getByRole('button',{name:'Buscar',exact:true}).click();
  await page.locator('.business-search-row').filter({hasText:/^Venta #/}).first().click();
  await capture('sale-detail');
  await page.getByRole('button',{name:'Cerrar detalle',exact:true}).first().click();
  // Static CSS fixtures exercise admin component styles without admin authentication.
  await page.evaluate(() => {
    const fixture=document.createElement('main');
    fixture.style.padding='20px';
    fixture.innerHTML='<div class="stack"><section class="panel hero-panel platform-admin-hero"><div class="hero-copy"><span>ADMINISTRACIÓN DE PLATAFORMA</span><strong>Local de prueba</strong><p>Vista de estilos con datos ficticios.</p></div><div class="hero-actions"><button class="secondary-action">Actualizar</button></div></section><section class="panel"><div class="report-grid"><div class="report-metric"><span>Locales activos</span><strong>3</strong></div><div class="report-metric warning"><span>Pago pendiente</span><strong>1</strong></div></div><div class="list"><div class="row platform-tenant-row selected-row"><button class="row-main-button"><span><strong>Negocio de prueba</strong><small>Minimarket</small></span></button><span class="status-badge success">Activo</span><button class="icon-button danger" aria-label="Eliminar">×</button></div><div class="row"><span class="status-badge warning">Suspendido</span><select><option>Básico</option></select></div></div></section></div>';
    document.getElementById('root').style.display='none';
    document.body.append(fixture);
  });
  await capture('platform-style-fixture');
  await page.setViewportSize({width:390,height:844});
  await capture('platform-style-fixture-mobile');
  fs.writeFileSync(path.join(output,'audit.json'),JSON.stringify(report,null,2));
  const issues=report.flatMap(result=>[
    ...result.low.map(issue=>({name:result.name,theme:result.theme,...issue})),
    ...(result.theme==='dark'?result.bright.map(issue=>({name:result.name,theme:result.theme,...issue})):[]),
    ...(result.overflow?[{name:result.name,theme:result.theme,overflow:true}]:[])
  ]);
  assert.deepEqual(issues,[],'Unexpected surfaces, text contrast or horizontal overflow: '+JSON.stringify(issues));
  console.log(`PASS: ${report.length} theme/view/viewport checks; no unexpected bright surfaces in dark mode, low-contrast solid-background text or page overflow. Gradients and image content require visual inspection.`);
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
