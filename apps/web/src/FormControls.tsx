import { useId, useState } from "react";
import type { InputHTMLAttributes, ReactNode } from "react";

function fieldMessage(input: HTMLInputElement) {
  if (input.validity.valueMissing) return "Completa este campo.";
  if (input.validity.typeMismatch) return "Ingresa un correo válido.";
  if (input.validity.badInput) return "Ingresa un número válido.";
  if (input.validity.rangeUnderflow) return `El valor mínimo es ${input.min}.`;
  if (input.validity.rangeOverflow) return `El valor máximo es ${input.max}.`;
  if (input.validity.stepMismatch) return "Ingresa un número entero.";
  if (input.validity.patternMismatch) return "Ingresa un valor válido, sin dejar solo espacios.";
  return input.validity.valid ? "" : "Revisa este valor.";
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

export function FormField({ label, value, onChange, id: suppliedId, className = "", ...props }: FieldProps) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const [error, setError] = useState("");
  return <div className={`form-field ui-field ${className}`}>
    <label htmlFor={id}>{label}</label>
    <input {...props} id={id} value={value} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined}
      onChange={event => { onChange(event.target.value); if (error) setError(fieldMessage(event.target)); }}
      onBlur={event => setError(fieldMessage(event.target))}
      onInvalid={event => { event.preventDefault(); setError(fieldMessage(event.currentTarget)); }} />
    <small className="field-error" id={`${id}-error`}>{error}</small>
  </div>;
}

export function FormSurface({ children, className, busy, onSave, label }: { children: ReactNode; className: string; busy: boolean; onSave: () => void; label: string }) {
  return <form className={className} aria-label={label} aria-busy={busy} noValidate onSubmit={event => {
    event.preventDefault();
    if (busy) return;
    if (event.currentTarget.checkValidity()) { onSave(); return; }
    const invalid = event.currentTarget.querySelector<HTMLInputElement>("input:invalid");
    // Optional fields can be inside a collapsed details element.
    let ancestor = invalid?.parentElement;
    while (ancestor && ancestor !== event.currentTarget) {
      if (ancestor instanceof HTMLDetailsElement) ancestor.open = true;
      ancestor = ancestor.parentElement;
    }
    invalid?.focus();
  }}><fieldset className="ui-form-body" disabled={busy}>{children}</fieldset></form>;
}
