import { Building2, CheckCircle2, Download, Monitor, Moon, Plus, Save, Sun, Trash2, Users, WalletCards } from "lucide-react";
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
  theme: ThemePreference;
  onUserForm: (value: UserFormState) => void;
  onProfileForm: (value: ProfileFormState) => void;
  onSaveProfile: () => void;
  onSaveBusiness: (value: BusinessFormState) => void;
  onCreateUser: () => void;
  onDeactivateUser: (user: User) => void;
  onTheme: (value: ThemePreference) => void;
  onOpenPlan: () => void;
  onExport: () => void;
};

export function SettingsView({ tenant, user, users, userForm, profileForm, isBusy, canManageUsers, theme, onUserForm, onProfileForm, onSaveProfile, onSaveBusiness, onCreateUser, onDeactivateUser, onTheme, onOpenPlan, onExport }: SettingsProps) {
  const [businessForm, setBusinessForm] = useState<BusinessFormState>({ name: "", businessType: "", address: "", phone: "" });

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

    <section className="panel" aria-labelledby="appearance-title">
      <div className="section-heading"><div><span>CONFIGURACIÓN</span><h2 id="appearance-title">Apariencia</h2></div><span>Se guarda por usuario</span></div>
      <div className="theme-selector" role="group" aria-label="Tema visual">
        {([{ id: "light", label: "Claro", icon: Sun }, { id: "dark", label: "Oscuro", icon: Moon }, { id: "system", label: "Sistema", icon: Monitor }] as const).map((option) => { const Icon = option.icon; return <button className={theme === option.id ? "secondary-action active" : "secondary-action"} type="button" aria-pressed={theme === option.id} onClick={() => onTheme(option.id)} key={option.id}><Icon size={18}/>{option.label}</button>; })}
      </div>
    </section>

    {canManageUsers && <section className="panel more-links" aria-labelledby="tools-title">
      <div className="section-heading"><div><span>HERRAMIENTAS</span><h2 id="tools-title">Plan y datos</h2></div></div>
      <div className="list">
        <button className="row-main-button" type="button" onClick={onOpenPlan}><WalletCards size={20}/><span><strong>Mi plan</strong><small>Revisa tu prueba, funciones y estado de activación.</small></span></button>
        <button className="row-main-button" type="button" onClick={onExport}><Download size={20}/><span><strong>Exportar mis datos</strong><small>Descarga productos, clientes, ventas y cierres en JSON.</small></span></button>
      </div>
    </section>}

    {canManageUsers && <section className="panel" aria-labelledby="users-title">
      <div className="section-heading"><div><span>ACCESOS</span><h2 id="users-title">Usuarios del local</h2></div><span>{users.length} activos</span></div>
      <p className="helper-text">Crea accesos individuales para cada vendedor. El dueño mantiene el control administrativo.</p>
      <div className="form-grid">
        <LabeledInput label="Nombre del usuario" value={userForm.name} onChange={(value) => onUserForm({ ...userForm, name: value })} />
        <LabeledInput label="Correo del usuario" value={userForm.email} onChange={(value) => onUserForm({ ...userForm, email: value })} type="email" />
        <label className="form-field"><span>Rol</span><select value={userForm.role} onChange={(event) => onUserForm({ ...userForm, role: event.target.value as User["role"] })}><option value="seller">Vendedor</option><option value="owner">Dueño/admin</option></select></label>
        <LabeledInput label="Clave inicial segura" value={userForm.password} onChange={(value) => onUserForm({ ...userForm, password: value })} type="password" autoComplete="new-password" />
      </div>
      <button className="primary-action" type="button" onClick={onCreateUser} disabled={isBusy || !userForm.name.trim() || !userForm.email.trim() || !userForm.password}><Plus size={19}/> Crear usuario</button>
      <div className="list user-list">
        {users.map((localUser) => <div className="row" key={localUser.id}><div><strong>{localUser.name}</strong><p>{localUser.email} · {localUser.role === "owner" ? "dueño/admin" : "vendedor"}</p></div><button className="secondary-action small danger-soft" type="button" onClick={() => onDeactivateUser(localUser)} disabled={isBusy || localUser.id === user.id}><Trash2 size={16}/> Desactivar</button></div>)}
      </div>
    </section>}

    <section className="panel"><div className="section-heading"><h2>Acerca de Localito</h2><span>Información del sistema</span></div><div className="settings-list"><p><strong>Negocio:</strong> {tenant?.name ?? "Localito"}.</p><p><strong>Sesión:</strong> {user.name} ({user.role === "owner" ? "dueño/admin" : "vendedor"}).</p><p><strong>Aplicación:</strong> PWA adaptable a celular, tablet y computador.</p><p><strong>Pagos:</strong> el vendedor confirma terminales y aplicaciones externas antes de registrar la venta.</p></div></section>
  </div>;
}

export function PlanView({ subscription, isBusy, onSelect }: { subscription: Subscription; isBusy: boolean; onSelect: (plan: SubscriptionPlan) => void }) {
  const days = subscriptionDaysRemaining(subscription);
  const status = effectiveSubscriptionStatus(subscription);
  const statusCopy = subscriptionStatusCopy(status, days);
  return <div className="stack">
    <section className="panel hero-panel plan-hero"><div className="hero-copy"><span>MI PLAN</span><strong>{status === "trialing" ? `Prueba Pro · ${days} días restantes` : LOCALITO_PLANS[subscription.plan].name}</strong><p>{statusCopy}</p></div></section>
    {(status === "past_due" || status === "expired" || status === "cancelled") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>{status === "past_due" ? "Activación pendiente" : "Tu acceso operativo está pausado"}</strong><p>Tus datos siguen guardados y puedes revisarlos. Elige un plan y solicita activación; un administrador confirmará el pago manualmente.</p></div></section>}
    {subscription.pendingPlan && (status === "active" || status === "trialing") && <section className="panel subscription-recovery" role="status"><WalletCards size={22}/><div><strong>Solicitud registrada: {LOCALITO_PLANS[subscription.pendingPlan].name}</strong><p>Tu acceso actual continúa sin cambios hasta que el pago sea verificado y el nuevo plan sea activado.</p></div></section>}
    <section className="plan-grid">
      {Object.values(LOCALITO_PLANS).map((plan) => {
        const isCurrent = plan.id === subscription.plan && status === "active";
        const isRequested = plan.id === subscription.pendingPlan;
        return <article className={plan.id === subscription.plan ? "panel plan-card current" : "panel plan-card"} key={plan.id}><div><span className="status-badge success">{isRequested ? "Solicitado" : plan.recommended ? "Recomendado" : "Esencial"}</span><h2>{plan.name}</h2><p>{plan.description}</p></div><strong className="plan-price">{formatCLP(plan.price)}<small>/mes</small></strong><ul>{plan.entitlements.map((feature) => <li key={feature}><CheckCircle2 size={16}/>{entitlementLabel(feature)}</li>)}</ul><button className={isCurrent ? "secondary-action full" : "primary-action full"} type="button" disabled={isBusy || isCurrent || isRequested} onClick={() => onSelect(plan.id)}>{isCurrent ? "Plan actual" : isRequested ? "Activación solicitada" : `Solicitar ${plan.name}`}</button></article>;
      })}
    </section>
    <p className="helper-text">Localito no cobra automáticamente en esta etapa. La solicitud queda pendiente hasta que el pago sea verificado y el administrador active el período correspondiente.</p>
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
