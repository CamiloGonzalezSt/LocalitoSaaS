import { Building2, CheckCircle2, Download, Pencil, Plus, Save, Trash2, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import type { Subscription, SubscriptionPlan, Tenant, User } from "@localito/shared";
import { effectiveSubscriptionStatus, LOCALITO_PLANS, subscriptionDaysRemaining } from "@localito/shared";
import { formatCLP } from "./lib/format";

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
    <section className="panel" aria-labelledby="account-title">
      <div className="section-heading"><div><span>MI CUENTA</span><h2 id="account-title">Mi perfil</h2></div><span>{user.role === "owner" ? "Dueño/admin" : "Vendedor"}</span></div>
      <div className="form-grid">
        <LabeledInput label="Nombre" value={profileForm.name} onChange={(value) => onProfileForm({ ...profileForm, name: value })} autoComplete="name" />
        <LabeledInput label="Correo" value={profileForm.email} onChange={(value) => onProfileForm({ ...profileForm, email: value })} type="email" autoComplete="email" />
      </div>
      <button className="primary-action" type="button" onClick={onSaveProfile} disabled={isBusy || !profileForm.name.trim() || !profileForm.email.trim()}><Save size={19}/> Guardar mi perfil</button>
    </section>

    {canManageUsers && <section className="panel" aria-labelledby="business-title">
      <div className="section-heading"><div><span>ADMINISTRACIÓN</span><h2 id="business-title">Mi negocio</h2></div><Building2 size={21}/></div>
      <p className="helper-text">Estos datos identifican el local en comprobantes y pantallas operativas.</p>
      <div className="form-grid">
        <LabeledInput label="Nombre del negocio" value={businessForm.name} onChange={(value) => setBusinessForm({ ...businessForm, name: value })} />
        <LabeledInput label="Rubro" value={businessForm.businessType} onChange={(value) => setBusinessForm({ ...businessForm, businessType: value })} />
        <LabeledInput label="Dirección" value={businessForm.address ?? ""} onChange={(value) => setBusinessForm({ ...businessForm, address: value })} />
        <LabeledInput label="Teléfono" value={businessForm.phone ?? ""} onChange={(value) => setBusinessForm({ ...businessForm, phone: value })} type="tel" />
      </div>
      <button className="primary-action" type="button" onClick={() => onSaveBusiness(businessForm)} disabled={isBusy || !businessForm.name.trim() || !businessForm.businessType.trim()}><Save size={19}/> Guardar negocio</button>
    </section>}

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

export function PlanView({ subscription, isBusy, onSelect }: { subscription: Subscription; isBusy: boolean; onSelect: (plan: SubscriptionPlan, provider: "webpay_sandbox" | "mercadopago_sandbox" | "transfer") => void }) {
  const days = subscriptionDaysRemaining(subscription);
  const status = effectiveSubscriptionStatus(subscription);
  const statusCopy = subscriptionStatusCopy(status, days);
  const [provider, setProvider] = useState<"webpay_sandbox" | "mercadopago_sandbox" | "transfer">("webpay_sandbox");
  return <div className="stack">
    <section className="panel hero-panel plan-hero"><div className="hero-copy"><span>MI PLAN</span><strong>{status === "trialing" ? `Prueba Pro · ${days} días restantes` : LOCALITO_PLANS[subscription.plan].name}</strong><p>{statusCopy}</p></div></section>
    {(status === "past_due" || status === "expired" || status === "cancelled") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>{status === "past_due" ? "Activación pendiente" : "Tu acceso operativo está pausado"}</strong><p>Tus datos siguen guardados y puedes revisarlos. Elige un plan y solicita activación; un administrador confirmará el pago manualmente.</p></div></section>}
    {subscription.pendingPlan && (status === "active" || status === "trialing") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>Solicitud registrada: {LOCALITO_PLANS[subscription.pendingPlan].name}</strong><p>Tu acceso actual continúa sin cambios hasta que el pago sea verificado y el nuevo plan sea activado.</p></div></section>}
    <section className="panel billing-methods"><div className="section-heading"><div><span>PAGO DE PRUEBA</span><h2>¿Cómo quieres probar la activación?</h2></div><span>No se cobrará dinero real</span></div><div className="billing-method-grid"><button className={provider === "webpay_sandbox" ? "billing-method active" : "billing-method"} type="button" onClick={() => setProvider("webpay_sandbox")}><strong>Webpay</strong><small>Ambiente de prueba · aprobación simulada</small></button><button className={provider === "mercadopago_sandbox" ? "billing-method active" : "billing-method"} type="button" onClick={() => setProvider("mercadopago_sandbox")}><strong>Mercado Pago</strong><small>Sandbox · aprobación simulada</small></button><button className={provider === "transfer" ? "billing-method active" : "billing-method"} type="button" onClick={() => setProvider("transfer")}><strong>Transferencia</strong><small>Queda pendiente de revisión administrativa</small></button></div></section>
    <section className="plan-grid">
      {Object.values(LOCALITO_PLANS).map((plan) => {
        const isCurrent = plan.id === subscription.plan && status === "active";
        const isRequested = plan.id === subscription.pendingPlan;
        return <article className={plan.id === subscription.plan ? "panel plan-card current" : "panel plan-card"} key={plan.id}><div><span className="status-badge success">{isRequested ? "Solicitado" : plan.recommended ? "Recomendado" : "Esencial"}</span><h2>{plan.name}</h2><p>{plan.description}</p></div><strong className="plan-price">{formatCLP(plan.price)}<small>/mes</small></strong><ul>{plan.entitlements.map((feature) => <li key={feature}><CheckCircle2 size={16}/>{entitlementLabel(feature)}</li>)}</ul><button className={isCurrent ? "secondary-action full" : "primary-action full"} type="button" disabled={isBusy || isCurrent || isRequested} onClick={() => onSelect(plan.id, provider)}>{isCurrent ? "Plan actual" : isRequested ? "Activación solicitada" : provider === "transfer" ? `Solicitar ${plan.name}` : `Probar pago y activar`}</button></article>;
      })}
    </section>
    <p className="helper-text">Webpay y Mercado Pago funcionan aquí en modo sandbox para la tesis: simulan una aprobación sin mover dinero. La transferencia mantiene el flujo manual de revisión.</p>
  </div>;
}

function LabeledInput({ label, value, onChange, type = "text", autoComplete }: { label: string; value: string; onChange: (value: string) => void; type?: string; autoComplete?: string }) {
  return <label className="form-field"><span>{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} type={type} autoComplete={autoComplete}/></label>;
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
