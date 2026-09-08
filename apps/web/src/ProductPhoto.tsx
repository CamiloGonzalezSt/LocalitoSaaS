import { useEffect, useRef, useState } from "react";
import { Camera, ImagePlus, Trash2, Check, X } from "lucide-react";
export function ProductPhoto({ value, disabled, onChange }: { value: string; disabled: boolean; onChange: (value: string) => void }) {
  const [source, setSource] = useState<HTMLImageElement>();
  const [zoom, setZoom] = useState(1), [offsetX, setOffsetX] = useState(0), [offsetY, setOffsetY] = useState(0);
  const [error, setError] = useState("");
  const canvas = useRef<HTMLCanvasElement>(null);
  const upload = useRef<HTMLInputElement>(null), camera = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (!source || !canvas.current) return;
    const ctx = canvas.current.getContext("2d")!;
    ctx.clearRect(0, 0, 512, 512);
    const scale = Math.min(460 / source.width, 460 / source.height) * zoom;
    const width = source.width * scale, height = source.height * scale;
    ctx.drawImage(source, (512 - width) / 2 + offsetX, (512 - height) / 2 + offsetY, width, height);
  }, [source, zoom, offsetX, offsetY]);
  async function select(file?: File) {
    setError("");
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) { setError("Elige PNG, JPG o WebP de hasta 10 MB."); return; }
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      if (image.width * image.height > 40000000) throw new Error("La imagen es demasiado grande.");
      setSource(image); setZoom(1); setOffsetX(0); setOffsetY(0);
    } catch { setError("No se pudo abrir la imagen. Prueba otra foto."); } finally { URL.revokeObjectURL(url); }
  }
  return <div className="product-photo-editor">
    <h3>Foto del producto</h3>
    <input ref={upload} className="capture-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={event => { void select(event.target.files?.[0]); event.target.value = ""; }}/>
    <input ref={camera} className="capture-input" type="file" accept="image/*" capture="environment" onChange={event => { void select(event.target.files?.[0]); event.target.value = ""; }}/>
    {source ? <>
      <canvas ref={canvas} width="512" height="512" aria-label="Encuadre de la foto"/>
      <label>Escala<input type="range" min="0.5" max="3" step="0.05" value={zoom} onChange={event => setZoom(Number(event.target.value))}/></label>
      <label>Posición horizontal<input type="range" min="-200" max="200" value={offsetX} onChange={event => setOffsetX(Number(event.target.value))}/></label>
      <label>Posición vertical<input type="range" min="-200" max="200" value={offsetY} onChange={event => setOffsetY(Number(event.target.value))}/></label>
      <div className="row-actions"><button className="secondary-action" type="button" disabled={disabled} onClick={() => { const image = canvas.current!.toDataURL("image/webp", .88); if (image.length > 700000) { setError("La foto supera el tamaño permitido. Reduce el encuadre."); return; } onChange(image); setSource(undefined); }}><Check size={18}/> Usar foto</button><button className="icon-button" type="button" title="Cancelar foto" aria-label="Cancelar foto" onClick={() => setSource(undefined)}><X size={18}/></button></div>
    </> : <>{value && <img src={value} alt="Foto del producto"/>}<div className="row-actions"><button className="secondary-action" type="button" disabled={disabled} onClick={() => upload.current?.click()}><ImagePlus size={18}/>{value ? "Cambiar foto" : "Subir foto"}</button><button className="icon-button" type="button" title="Tomar foto" aria-label="Tomar foto" disabled={disabled} onClick={() => camera.current?.click()}><Camera size={18}/></button>{value && <button className="icon-button danger" type="button" title="Eliminar foto" aria-label="Eliminar foto" disabled={disabled} onClick={() => onChange("")}><Trash2 size={18}/></button>}</div></>}
    {error && <p role="alert" className="sale-storage-error">{error}</p>}
  </div>;
}
