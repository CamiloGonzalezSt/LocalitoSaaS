import { useEffect, useId, useState } from "react";
import { Banknote, Check, CreditCard, Smartphone, ReceiptText, Split, MoreHorizontal } from "lucide-react";
import type { PaymentMethod } from "@localito/shared";

const methods = [
  { id: "cash", label: "Efectivo", icon: Banknote },
  { id: "card", label: "Tarjeta", icon: CreditCard },
  { id: "transfer", label: "Transferencia", icon: Smartphone },
  { id: "webpay", label: "Webpay", icon: CreditCard },
  { id: "mercadopago", label: "Mercado Pago", icon: Smartphone },
  { id: "mixed", label: "Pago mixto", icon: Split },
  { id: "credit", label: "Fiado", icon: ReceiptText }
] as const;

export function CheckoutPayment({ value, allowed, disabled, onChange }: {
  value: PaymentMethod; allowed: PaymentMethod[]; disabled: boolean; onChange: (value: PaymentMethod) => void;
}) {
  const ordered = allowed.map(id => methods.find(method => method.id === id)!).filter(Boolean);
  const regular = ordered.filter(method => !["mixed", "credit"].includes(method.id));
  const primary = regular.slice(0, 3), extra = regular.slice(3);
  const extraSelected = extra.some(method => method.id === value);
  const [more, setMore] = useState(extraSelected);
  const extraId = useId();
  useEffect(() => { if (extraSelected) setMore(true); }, [extraSelected]);
  const renderMethod = (method: typeof methods[number]) => <button key={method.id} type="button"
    className="checkout-method" aria-pressed={value === method.id} disabled={disabled}
    onClick={() => onChange(method.id)}><method.icon size={21} aria-hidden="true"/><span>{method.label}</span><Check className="checkout-selection" size={13} aria-hidden="true"/></button>;
  return <div className="checkout-method-picker">
    <div className="checkout-primary-methods" role="group" aria-label="Medios de pago">
      {primary.map(renderMethod)}
    </div>
    <div className="checkout-other-actions" role="group" aria-label="Otras formas de cobro">
      {methods.filter(method => ["mixed", "credit"].includes(method.id) && allowed.includes(method.id)).map(renderMethod)}
      {extra.length > 0 && <button type="button" className="checkout-method"
        aria-expanded={more} aria-controls={extraId} disabled={disabled}
        onClick={() => setMore(current => !current)}><MoreHorizontal size={20}/><span>{extraSelected && !more ? methods.find(method => method.id === value)?.label : "Más"}</span></button>}
    </div>
    {more && <div id={extraId} className="checkout-extra-methods" role="group" aria-label="Pagos externos">
      {extra.map(renderMethod)}
    </div>}
  </div>;
}
