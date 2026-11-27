import { Building2, CheckCircle2, Download, ExternalLink, Pencil, Plus, Save, Trash2, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import type { BillingProvider, Subscription, SubscriptionPlan, Tenant, User } from "@localito/shared";
import { effectiveSubscriptionStatus, LOCALITO_PLANS, subscriptionDaysRemaining } from "@localito/shared";
import { formatCLP } from "./lib/format";
import { FormField, FormSurface } from "./FormControls";

export type ThemePreference = "light" | "dark" | "system";
export type UserFormState = { name: string; email: string; role: User["role"]; password: string };
export type ProfileFormState = { name: string; email: string };
export type BusinessFormState = Pick<Tenant, "name" | "businessType" | "address" | "phone">;

type SettingsProps = {
  tenant: Tenant | null;
  user: User;
  users: User[];
  userForm: UserFormState;
  profileForm: ProfileFormState;
  isBusy: boolean;
  canManageUsers: boolean;
  onUserForm: (value: UserFormState) => void;
  onProfileForm: (value: ProfileFormState) => void;
  onSaveProfile: () => void;
  onSaveBusiness: (value: BusinessFormState) => void;
  onCreateUser: () => void;
  onUpdateUser: (user: User, body: Partial<User>) => void;
  onDeleteUser: (user: User) => void;
  onResetUserPassword: (user: User, password: string) => void;
  onOpenPlan: () => void;
  onExport: () => void;
};

export function SettingsView({ tenant, user, users, userForm, profileForm, isBusy, canManageUsers, onUserForm, onProfileForm, onSaveProfile, onSaveBusiness, onCreateUser, onUpdateUser, onDeleteUser, onResetUserPassword, onOpenPlan, onExport }: SettingsProps) {
  const [businessForm, setBusinessForm] = useState<BusinessFormState>({ name: "", businessType: "", address: "", phone: "" });
  const [editingUserId, setEditingUserId] = useState("");

  useEffect(() => {
    setBusinessForm({ name: tenant?.name ?? "", businessType: tenant?.businessType ?? "", address: tenant?.address ?? "", phone: tenant?.phone ?? "" });
  }, [tenant?.id, tenant?.name, tenant?.businessType, tenant?.address, tenant?.phone]);

  return <div className="stack account-settings">
    <FormSurface className="panel" label="Mi perfil" busy={isBusy} onSave={onSaveProfile}>
      <div className="section-heading"><div><span>MI CUENTA</span><h2 id="account-title">Mi perfil</h2></div><span>{user.role === "owner" ? "Dueño/admin" : "Vendedor"}</span></div>
      <div className="form-grid">
        <FormField label="Nombre" required pattern=".*\S.*" value={profileForm.name} onChange={(value) => onProfileForm({ ...profileForm, name: value })} autoComplete="name" />
        <FormField label="Correo" required value={profileForm.email} onChange={(value) => onProfileForm({ ...profileForm, email: value })} type="email" autoComplete="email" />
      </div>
      <button className="primary-action" type="submit"><Save size={19}/> {isBusy ? "Guardando..." : "Guardar mi perfil"}</button>
    </FormSurface>

    {canManageUsers && <FormSurface className="panel" label="Mi negocio" busy={isBusy} onSave={() => onSaveBusiness(businessForm)}>
      <div className="section-heading"><div><span>ADMINISTRACIÓN</span><h2 id="business-title">Mi negocio</h2></div><Building2 size={21}/></div>
      <div className="form-grid">
        <FormField label="Nombre del negocio" required pattern=".*\S.*" value={businessForm.name} onChange={(value) => setBusinessForm({ ...businessForm, name: value })} />
        <FormField label="Rubro" required pattern=".*\S.*" value={businessForm.businessType} onChange={(value) => setBusinessForm({ ...businessForm, businessType: value })} />
        <LabeledInput label="Dirección" value={businessForm.address ?? ""} onChange={(value) => setBusinessForm({ ...businessForm, address: value })} />
        <LabeledInput label="Teléfono" value={businessForm.phone ?? ""} onChange={(value) => setBusinessForm({ ...businessForm, phone: value })} type="tel" />
      </div>
      <button className="primary-action" type="submit"><Save size={19}/> {isBusy ? "Guardando..." : "Guardar negocio"}</button>
    </FormSurface>}

    {canManageUsers && <section className="panel more-links" aria-labelledby="tools-title">
      <div className="section-heading"><div><span>HERRAMIENTAS</span><h2 id="tools-title">Plan y datos</h2></div></div>
      <div className="list">
        <button className="row-main-button" type="button" onClick={onOpenPlan}><WalletCards size={20}/><span><strong>Mi plan</strong><small>Revisa tu prueba, funciones y estado de activación.</small></span></button>
        <button className="row-main-button" type="button" onClick={onExport}><Download size={20}/><span><strong>Exportar mis datos</strong><small>Descarga productos, clientes, ventas y cierres en JSON.</small></span></button>
      </div>
    </section>}

    {canManageUsers && <section className="panel" aria-labelledby="users-title">
      <div className="section-heading"><div><span>ACCESOS</span><h2 id="users-title">Usuarios del local</h2></div><span>{users.filter((item) => item.active !== false).length} activos</span></div>
      <p className="helper-text">Crea accesos individuales para cada vendedor. El dueño mantiene el control administrativo.</p>
      <div className="form-grid">
        <LabeledInput label="Nombre del usuario" value={userForm.name} onChange={(value) => onUserForm({ ...userForm, name: value })} />
        <LabeledInput label="Correo del usuario" value={userForm.email} onChange={(value) => onUserForm({ ...userForm, email: value })} type="email" />
        <label className="form-field"><span>Rol</span><select value={userForm.role} onChange={(event) => onUserForm({ ...userForm, role: event.target.value as User["role"] })}><option value="seller">Vendedor</option><option value="owner">Dueño/admin</option></select></label>
        <LabeledInput label={editingUserId ? "Nueva clave (opcional)" : "Clave inicial segura"} value={userForm.password} onChange={(value) => onUserForm({ ...userForm, password: value })} type="password" autoComplete="new-password" />
      </div>
      <div className="row-actions"><button className="primary-action" type="button" onClick={() => { const editing = users.find((item) => item.id === editingUserId); if (editing) { onUpdateUser(editing, { name: userForm.name, email: userForm.email, role: userForm.role }); if (userForm.password) onResetUserPassword(editing, userForm.password); setEditingUserId(""); onUserForm({ name: "", email: "", role: "seller", password: "" }); } else onCreateUser(); }} disabled={isBusy || !userForm.name.trim() || !userForm.email.trim() || (!editingUserId && !userForm.password)}>{editingUserId ? <Save size={19}/> : <Plus size={19}/>} {editingUserId ? "Guardar usuario" : "Crear usuario"}</button>{editingUserId && <button className="secondary-action" type="button" onClick={() => { setEditingUserId(""); onUserForm({ name: "", email: "", role: "seller", password: "" }); }}>Cancelar</button>}</div>
      <div className="list user-list">
        {users.map((localUser) => <div className="row" key={localUser.id}><div><strong>{localUser.name}</strong><p>{localUser.email} · {localUser.role === "owner" ? "dueño/admin" : "vendedor"} · {localUser.active === false ? "inactivo" : "activo"}</p></div><div className="row-actions"><button className="icon-button" type="button" aria-label={`Editar ${localUser.name}`} onClick={() => { setEditingUserId(localUser.id); onUserForm({ name: localUser.name, email: localUser.email, role: localUser.role, password: "" }); }} disabled={isBusy}><Pencil size={16}/></button><button className="secondary-action small" type="button" onClick={() => onUpdateUser(localUser, { active: localUser.active === false })} disabled={isBusy || localUser.id === user.id}>{localUser.active === false ? "Reactivar" : "Desactivar"}</button><button className="icon-button danger" type="button" aria-label={`Eliminar ${localUser.name}`} onClick={() => onDeleteUser(localUser)} disabled={isBusy || localUser.id === user.id}><Trash2 size={16}/></button></div></div>)}
      </div>
    </section>}
  </div>;
}

export type PlanPaymentMethod = BillingProvider | "transfer";

const paymentMethodCopy: Record<PlanPaymentMethod, { title: string; detail: string; action: string }> = {
  webpay: { title: "Webpay", detail: "Webpay Plus · ambiente de integración Transbank", action: "Pagar con Webpay" },
  mercadopago: { title: "Mercado Pago", detail: "Checkout Pro · credenciales de prueba", action: "Pagar con Mercado Pago" },
  transfer: { title: "Transferencia", detail: "Queda pendiente de revisión administrativa", action: "Solicitar" }
};

export function PlanView({ subscription, isBusy, onSelect }: { subscription: Subscription; isBusy: boolean; onSelect: (plan: SubscriptionPlan, provider: PlanPaymentMethod) => void }) {
  const days = subscriptionDaysRemaining(subscription);
  const status = effectiveSubscriptionStatus(subscription);
  const statusCopy = subscriptionStatusCopy(status, days);
  const [provider, setProvider] = useState<PlanPaymentMethod>("webpay");
  const online = provider !== "transfer";
  return <div className="stack">
    <section className="panel hero-panel plan-hero"><div className="hero-copy"><span>MI PLAN</span><strong>{status === "trialing" ? `Prueba Pro · ${days} días restantes` : LOCALITO_PLANS[subscription.plan].name}</strong><p>{statusCopy}</p></div></section>
    {(status === "past_due" || status === "expired" || status === "cancelled") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>{status === "past_due" ? "Activación pendiente" : "Tu acceso operativo está pausado"}</strong><p>Tus datos siguen guardados y puedes revisarlos. Paga con Webpay o Mercado Pago para reactivar al instante, o solicita activación por transferencia.</p></div></section>}
    {subscription.pendingPlan && (status === "active" || status === "trialing") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>Solicitud registrada: {LOCALITO_PLANS[subscription.pendingPlan].name}</strong><p>Tu acceso actual continúa sin cambios hasta que el pago sea verificado y el nuevo plan sea activado.</p></div></section>}
    <section className="panel billing-methods"><div className="section-heading"><div><span>MEDIO DE PAGO</span><h2>¿Cómo quieres pagar tu plan?</h2></div><span>Modo prueba · sin cobros reales</span></div><div className="billing-method-grid">{(Object.keys(paymentMethodCopy) as PlanPaymentMethod[]).map((method) => <button key={method} className={provider === method ? "billing-method active" : "billing-method"} type="button" aria-pressed={provider === method} onClick={() => setProvider(method)}><strong>{paymentMethodCopy[method].title}</strong><small>{paymentMethodCopy[method].detail}</small></button>)}</div>{online && <TestPaymentHint provider={provider}/>}</section>
    <section className="plan-grid">
      {Object.values(LOCALITO_PLANS).map((plan) => {
        const isCurrent = plan.id === subscription.plan && status === "active";
        const isRequested = plan.id === subscription.pendingPlan;
        const label = isCurrent ? "Plan actual" : isRequested && !online ? "Activación solicitada" : online ? paymentMethodCopy[provider].action : `Solicitar ${plan.name}`;
        return <article className={plan.id === subscription.plan ? "panel plan-card current" : "panel plan-card"} key={plan.id}><div><span className="status-badge success">{isRequested ? "Solicitado" : plan.recommended ? "Recomendado" : "Esencial"}</span><h2>{plan.name}</h2><p>{plan.description}</p></div><strong className="plan-price">{formatCLP(plan.price)}<small>/mes</small></strong><ul>{plan.entitlements.map((feature) => <li key={feature}><CheckCircle2 size={16}/>{entitlementLabel(feature)}</li>)}</ul><button className={isCurrent ? "secondary-action full" : "primary-action full"} type="button" disabled={isBusy || isCurrent || (isRequested && !online)} onClick={() => onSelect(plan.id, provider)}>{online && !isCurrent && <ExternalLink size={16}/>}{isBusy && online && !isCurrent ? "Conectando…" : label}</button></article>;
      })}
    </section>
    <p className="helper-text">Al pagar te llevamos a la página segura de la pasarela y, al terminar, vuelves a Localito con el plan activado. Ambas pasarelas están en modo prueba: no se mueve dinero real. La transferencia mantiene el flujo manual de revisión.</p>
  </div>;
}

function TestPaymentHint({ provider }: { provider: BillingProvider }) {
  if (provider === "webpay") {
    return <div className="billing-test-hint" role="note"><strong>Datos de prueba Webpay</strong><span>Tarjeta VISA <code>4051 8856 0044 6623</code> · CVV <code>123</code> · cualquier fecha futura.</span><span>Si pide autenticación: RUT <code>11.111.111-1</code> · clave <code>123</code>.</span></div>;
  }
  return <div className="billing-test-hint" role="note"><strong>Datos de prueba Mercado Pago</strong><span>Entra con tu cuenta compradora de prueba (en incógnito) y usa una tarjeta de prueba de tu panel.</span><span>Titular <code>APRO</code> = aprobado · <code>OTHE</code> = rechazado · CVV <code>123</code>.</span></div>;
}

function LabeledInput({ label, value, onChange, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return <FormField label={label} value={value} onChange={onChange} type={type} autoComplete={autoComplete}/>;
}

function subscriptionStatusCopy(status: Subscription["status"], days: number) {
  if (status === "trialing") return `Estás usando todas las funciones Pro. La prueba termina en ${days} días.`;
  if (status === "active") return "Tu suscripción está activa. Los datos y permisos corresponden al plan seleccionado.";
  if (status === "past_due") return "Tu solicitud o renovación está pendiente de confirmación.";
  if (status === "cancelled") return "La suscripción fue cancelada. Tus datos siguen guardados en modo lectura.";
  return "La prueba o período terminó. Tus datos siguen guardados en modo lectura.";
}

function entitlementLabel(value: string) {
  const labels: Record<string, string> = { sales: "Ventas y ticket", inventory: "Inventario", products: "Catálogo", cashRegister: "Caja", imports: "Importación masiva", customers: "Clientes", credit: "Fiado", suppliers: "Proveedores", purchases: "Compras", advancedReports: "Reportes avanzados", audit: "Auditoría", alerts: "Alertas", aiPhotoSale: "Venta con foto", advancedAnalytics: "Analítica avanzada" };
  return labels[value] ?? value;
}
