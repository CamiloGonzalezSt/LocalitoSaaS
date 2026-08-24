import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import type { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import type { Product, QuickSaleAnalysis, QuickSaleDetectedItem } from "@localito/shared";
import { AlertTriangle, Camera, Check, ImagePlus, LoaderCircle, Minus, Package, Plus, RotateCcw, ScanLine, Search, ShoppingCart, Trash2, WifiOff, X } from "lucide-react";
import { api } from "./lib/api";
import { captureVideoFrame, prepareQuickSaleImage } from "./imageProcessing";

type QuickSaleDraft = QuickSaleDetectedItem & { confirmed: boolean };

const money = (value: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(value || 0);

function draftFromAnalysis(analysis: QuickSaleAnalysis): QuickSaleDraft[] {
  return analysis.items.map((item) => ({ ...item, confirmed: item.status === "matched" && Boolean(item.productId) }));
}

function cameraErrorMessage(error: unknown) {
  const name = error instanceof DOMException ? error.name : "";
  if (name === "NotAllowedError" || name === "SecurityError") return "No pudimos acceder a la cámara. Revisa el permiso de cámara del navegador e intenta nuevamente.";
  if (name === "NotFoundError" || name === "DevicesNotFoundError") return "No encontramos una cámara disponible. Puedes subir una foto desde el dispositivo.";
  return "No pudimos acceder a la cámara. Puedes subir una foto o revisar los permisos del navegador.";
}

export function QuickSaleView({
  products,
  onAddToSale,
  onOpenSale
}: {
  products: Product[];
  onAddToSale: (items: Array<{ productId: string; quantity: number }>) => boolean;
  onOpenSale: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeControlsRef = useRef<IScannerControls | null>(null);
  const barcodeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [barcodeActive, setBarcodeActive] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [drafts, setDrafts] = useState<QuickSaleDraft[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [message, setMessage] = useState("Toma una sola foto clara con todos los productos visibles.");
  const [busy, setBusy] = useState(false);
  const [searchingItemId, setSearchingItemId] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const productById = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const filteredProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase("es");
    if (!query) return products.slice(0, 8);
    return products.filter((product) => [product.name, product.brand, product.category, product.barcode, product.sku]
      .filter(Boolean).some((value) => value?.toLocaleLowerCase("es").includes(query))).slice(0, 12);
  }, [productSearch, products]);
  const detectedTotal = useMemo(() => drafts.reduce((sum, item) => {
    const product = item.productId ? productById.get(item.productId) : undefined;
    return sum + (item.confirmed && product ? product.salePrice * item.quantity : 0);
  }, 0), [drafts, productById]);
  const unresolvedCount = drafts.filter((item) => !item.confirmed || !item.productId).length;

  function stopCamera() {
    barcodeControlsRef.current?.stop();
    barcodeControlsRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
    setBarcodeActive(false);
  }

  function resetCapture() {
    stopCamera();
    setImageDataUrl("");
    setDrafts([]);
    setWarnings([]);
    setSearchingItemId("");
    setProductSearch("");
    setMessage("Toma una sola foto clara con todos los productos visibles.");
  }

  async function startCamera() {
    if (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      setMessage("La cámara necesita una conexión segura. Usa Subir foto o abre Localito con HTTPS.");
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Este navegador no permite abrir la cámara aquí. Usa la cámara del teléfono o sube una foto.");
      return;
    }
    stopCamera();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setMessage("Ubica todos los productos dentro del recuadro y toma la foto.");
    } catch (error) {
      stopCamera();
      setMessage(cameraErrorMessage(error));
    }
  }

  function takePhoto() {
    try {
      const image = captureVideoFrame(videoRef.current as HTMLVideoElement);
      setImageDataUrl(image);
      setDrafts([]);
      setWarnings([]);
      stopCamera();
      setMessage("Revisa la foto. Si se ve clara, continúa con el análisis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos tomar la foto.");
    }
  }

  async function selectPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    stopCamera();
    setBusy(true);
    try {
      const prepared = await prepareQuickSaleImage(file);
      setImageDataUrl(prepared);
      setDrafts([]);
      setWarnings([]);
      setMessage("Revisa la foto. Si se ve clara, continúa con el análisis.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No pudimos preparar la foto.");
    } finally {
      setBusy(false);
    }
  }

  async function analyzePhoto() {
    if (!imageDataUrl || busy) return;
    if (!navigator.onLine) {
      setMessage("Venta Rápida necesita conexión para reconocer productos. El resto de Localito puede seguir usándose.");
      return;
    }
    setBusy(true);
    setDrafts([]);
    setWarnings([]);
    setMessage("Analizando productos...");
    const progressTimer = window.setTimeout(() => setMessage("Buscando coincidencias en tu inventario..."), 700);
    try {
      const response = await api.analyzeQuickSaleImage(imageDataUrl);
      setDrafts(draftFromAnalysis(response.data));
      setWarnings(response.data.warnings);
      setMessage("Revisa cantidades y productos antes de agregarlos a la venta.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "No pudimos analizar la imagen. Puedes intentarlo nuevamente.";
      setMessage(/No encontramos productos/i.test(errorMessage) ? "No encontramos productos claramente visibles." : errorMessage);
    } finally {
      window.clearTimeout(progressTimer);
      setBusy(false);
    }
  }

  function updateDraft(itemId: string, changes: Partial<QuickSaleDraft>) {
    setDrafts((current) => current.map((item) => item.id === itemId ? { ...item, ...changes } : item));
  }

  function chooseProduct(itemId: string, productId: string) {
    const product = productById.get(productId);
    if (!product) return;
    updateDraft(itemId, {
      productId: product.id,
      productName: product.name,
      salePrice: product.salePrice,
      stock: product.stock,
      trackStock: product.trackStock !== false,
      status: "matched",
      confirmed: true
    });
    setSearchingItemId("");
    setProductSearch("");
  }

  function confirmSuggestedProduct(itemId: string) {
    const item = drafts.find((candidate) => candidate.id === itemId);
    if (!item?.productId) return;
    updateDraft(itemId, { confirmed: true, status: "matched" });
  }

  function removeDraft(itemId: string) {
    setDrafts((current) => current.filter((item) => item.id !== itemId));
    if (searchingItemId === itemId) setSearchingItemId("");
  }

  function addDetectedSale() {
    const items = drafts.flatMap((item) => item.confirmed && item.productId ? [{ productId: item.productId, quantity: item.quantity }] : []);
    if (!items.length || unresolvedCount) {
      setMessage("Confirma o ignora los productos pendientes antes de continuar.");
      return;
    }
    onAddToSale(items);
  }

  function recognizeBarcode(rawValue: string) {
    const normalized = rawValue.replace(/\D/g, "");
    if (!normalized) {
      setMessage("Ingresa o escanea un código válido.");
      return;
    }
    const product = products.find((candidate) => candidate.barcode?.replace(/\D/g, "") === normalized);
    const item: QuickSaleDraft = product ? {
      id: `codigo-${Date.now()}`,
      observedLabel: `Código ${normalized}`,
      productId: product.id,
      productName: product.name,
      quantity: 1,
      confidence: 0.99,
      status: "matched",
      salePrice: product.salePrice,
      stock: product.stock,
      trackStock: product.trackStock !== false,
      candidates: [],
      confirmed: true
    } : {
      id: `codigo-${Date.now()}`,
      observedLabel: `Código ${normalized}`,
      quantity: 1,
      confidence: 0,
      status: "unrecognized",
      candidates: [],
      confirmed: false
    };
    stopCamera();
    setImageDataUrl("");
    setDrafts([item]);
    setWarnings(product ? [] : ["Ese código no está asociado a un producto del inventario."]);
    setMessage(product ? "Código encontrado. Revisa el producto antes de agregarlo." : "Producto no reconocido. Puedes buscarlo manualmente o ignorarlo.");
  }

  async function startBarcodeScanner() {
    if (!navigator.mediaDevices?.getUserMedia || (!window.isSecureContext && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1")) {
      setMessage("La lectura en vivo necesita permiso de cámara y una conexión segura.");
      return;
    }
    stopCamera();
    try {
      if (!barcodeReaderRef.current) {
        const { BrowserMultiFormatReader: Reader } = await import("@zxing/browser");
        barcodeReaderRef.current = new Reader(undefined, { delayBetweenScanAttempts: 120, delayBetweenScanSuccess: 600 });
      }
      setBarcodeActive(true);
      setMessage("Apunta al código de barras.");
      barcodeControlsRef.current = await barcodeReaderRef.current.decodeFromConstraints(
        { video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        videoRef.current ?? undefined,
        (result, _error, controls) => {
          const value = result?.getText();
          if (!value) return;
          controls.stop();
          barcodeControlsRef.current = null;
          recognizeBarcode(value);
        }
      );
    } catch (error) {
      stopCamera();
      setMessage(cameraErrorMessage(error));
    }
  }

  useEffect(() => stopCamera, []);

  return <div className="quick-sale-stack">
    <section className="panel quick-sale-hero">
      <div className="quick-sale-hero-icon"><Camera size={30} /></div>
      <div><span>MENOS PASOS PARA VENDER</span><h2>Venta Rápida</h2><p>Toma una foto de los productos y Localito preparará la venta automáticamente.</p></div>
    </section>

    <section className="panel quick-sale-capture">
      <input ref={cameraInputRef} className="capture-input" type="file" accept="image/*" capture="environment" onChange={(event) => void selectPhoto(event)} />
      <input ref={uploadInputRef} className="capture-input" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void selectPhoto(event)} />

      <div className={cameraActive || barcodeActive ? "quick-camera-live active" : "quick-camera-live"}>
        <video ref={videoRef} playsInline muted autoPlay />
        <div className="quick-camera-guide"><span>Productos dentro del recuadro</span></div>
        <div className="quick-camera-actions">
          {!barcodeActive && <button className="primary-action" type="button" onClick={takePhoto}><Camera size={20} /> Tomar foto</button>}
          <button className="secondary-action" type="button" onClick={stopCamera}><X size={20} /> Cancelar</button>
        </div>
      </div>

      {!cameraActive && !barcodeActive && !imageDataUrl && drafts.length === 0 && <div className="quick-capture-empty">
        <div className="quick-capture-illustration"><ScanLine size={46} /><span>Incluye todos los productos en una sola foto</span></div>
        <button className="primary-action quick-main-action" type="button" disabled={busy} onClick={() => void startCamera()}><Camera size={23} /> Abrir cámara</button>
        <div className="quick-secondary-actions">
          <button className="secondary-action" type="button" disabled={busy} onClick={() => cameraInputRef.current?.click()}><Camera size={19} /> Cámara del teléfono</button>
          <button className="secondary-action" type="button" disabled={busy} onClick={() => uploadInputRef.current?.click()}><ImagePlus size={19} /> Subir foto</button>
        </div>
        <small>La imagen se comprime antes de enviarse y no se guarda en Localito.</small>
      </div>}

      {imageDataUrl && drafts.length === 0 && <div className="quick-photo-preview">
        <img src={imageDataUrl} alt="Foto de productos para Venta Rápida" />
        <div className="quick-preview-actions">
          <button className="primary-action" type="button" disabled={busy} onClick={() => void analyzePhoto()}>{busy ? <LoaderCircle className="spin" size={20} /> : <ScanLine size={20} />} {busy ? "Analizando..." : "Analizar productos"}</button>
          <button className="secondary-action" type="button" disabled={busy} onClick={resetCapture}><RotateCcw size={19} /> Volver a tomar foto</button>
        </div>
      </div>}

      <div className={`quick-status ${/conexión|permiso|No pudimos|No encontramos|necesita/i.test(message) ? "warning" : ""}`} aria-live="polite">
        {busy ? <LoaderCircle className="spin" size={19} /> : /conexión/i.test(message) ? <WifiOff size={19} /> : <Check size={19} />}
        <span>{message}</span>
      </div>

      {!imageDataUrl && drafts.length === 0 && <details className="quick-barcode-option">
        <summary><ScanLine size={18} /> Vender con código de barras</summary>
        <p>Esta opción sigue disponible y funciona sin reconocimiento visual.</p>
        <div><input inputMode="numeric" value={barcode} onChange={(event) => setBarcode(event.target.value)} placeholder="Código de barras" /><button className="secondary-action" type="button" onClick={() => recognizeBarcode(barcode)}><Search size={18} /> Buscar código</button></div>
        <button className="secondary-action full" type="button" onClick={() => void startBarcodeScanner()}><Camera size={18} /> Leer código con cámara</button>
      </details>}
    </section>

    {drafts.length > 0 && <section className="panel quick-review-panel">
      <div className="quick-review-heading"><div><span>REVISA ANTES DE CONTINUAR</span><h2>Venta detectada</h2></div><strong>{drafts.length} {drafts.length === 1 ? "producto" : "productos"}</strong></div>
      {warnings.length > 0 && <div className="quick-warning-summary"><AlertTriangle size={18} /><span>{warnings[0]}{warnings.length > 1 ? ` y ${warnings.length - 1} advertencias más.` : ""}</span></div>}

      <div className="quick-detected-list">{drafts.map((item) => {
        const product = item.productId ? productById.get(item.productId) : undefined;
        const stockInsufficient = Boolean(product?.trackStock !== false && product && item.quantity > product.stock);
        const needsReview = !item.confirmed || !product;
        return <article className={`quick-detected-item ${needsReview ? "needs-review" : "ready"}`} key={item.id}>
          <div className="quick-item-top">
            <div className="quick-item-icon">{needsReview ? <AlertTriangle size={22} /> : <Package size={22} />}</div>
            <div className="quick-item-copy"><span>{needsReview ? item.status === "unrecognized" ? "Producto no reconocido" : "Confirma esta sugerencia" : "Producto listo"}</span><strong>{product?.name ?? item.observedLabel}</strong>{product?.brand && <small>{product.brand}{product.variant ? ` · ${product.variant}` : ""}</small>}</div>
            <button className="quick-remove" type="button" aria-label={`Ignorar ${product?.name ?? item.observedLabel}`} onClick={() => removeDraft(item.id)}><Trash2 size={19} /></button>
          </div>

          {item.status === "needs_confirmation" && !item.confirmed && <div className="quick-candidate-box">
            <p>No estoy completamente seguro. Confirma una opción:</p>
            <div>{item.candidates.map((candidate) => <button type="button" key={candidate.productId} onClick={() => chooseProduct(item.id, candidate.productId)}>{candidate.name}</button>)}</div>
            {item.productId && <button className="secondary-action full" type="button" onClick={() => confirmSuggestedProduct(item.id)}><Check size={18} /> Confirmar sugerencia</button>}
          </div>}

          <div className="quick-item-controls">
            <div className="quick-quantity"><button type="button" aria-label="Disminuir cantidad" onClick={() => updateDraft(item.id, { quantity: Math.max(1, item.quantity - 1) })}><Minus size={20} /></button><strong>{item.quantity}</strong><button type="button" aria-label="Aumentar cantidad" onClick={() => updateDraft(item.id, { quantity: Math.min(99, item.quantity + 1) })}><Plus size={20} /></button></div>
            {product && <div className="quick-item-price"><span>{money(product.salePrice)} c/u</span><strong>{money(product.salePrice * item.quantity)}</strong></div>}
          </div>

          {stockInsufficient && <div className="quick-stock-warning"><AlertTriangle size={17} /><span><strong>Stock registrado insuficiente.</strong> Detectados: {item.quantity} · Stock: {product?.stock}</span></div>}

          <button className="quick-change-product" type="button" onClick={() => { setSearchingItemId(searchingItemId === item.id ? "" : item.id); setProductSearch(""); }}><Search size={17} /> {product ? "Cambiar producto" : "Buscar producto manualmente"}</button>
          {searchingItemId === item.id && <div className="quick-product-search"><input autoFocus value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder="Nombre, marca o código" /><div>{filteredProducts.map((candidate) => <button type="button" key={candidate.id} onClick={() => chooseProduct(item.id, candidate.id)}><span><strong>{candidate.name}</strong><small>{candidate.brand ?? candidate.category}</small></span><b>{money(candidate.salePrice)}</b></button>)}</div>{filteredProducts.length === 0 && <p>No encontramos productos con esa búsqueda.</p>}</div>}
        </article>;
      })}</div>

      <div className="quick-total"><span>Total detectado</span><strong>{money(detectedTotal)}</strong><small>Los precios provienen del inventario de Localito.</small></div>
      {unresolvedCount > 0 && <p className="quick-pending-note"><AlertTriangle size={17} /> Confirma, cambia o ignora los {unresolvedCount} productos pendientes.</p>}
      <div className="quick-review-actions">
        <button className="primary-action quick-main-action" type="button" disabled={!drafts.length || unresolvedCount > 0} onClick={addDetectedSale}><ShoppingCart size={21} /> Agregar a la venta</button>
        <button className="secondary-action" type="button" onClick={resetCapture}><RotateCcw size={19} /> Volver a tomar foto</button>
        <button className="secondary-action" type="button" onClick={onOpenSale}>Ir a venta manual</button>
      </div>
    </section>}
  </div>;
}
