import { useEffect, useMemo, useState } from "react";
import { Building2, Clock3, Package, Pencil, Plus, Power, RefreshCw, ShieldAlert, Store, Trash2, TrendingUp, Users, WalletCards } from "lucide-react";
import { LOCALITO_PLANS, subscriptionDaysRemaining } from "@localito/shared";
import type { PlatformTenantSummary, Subscription, SubscriptionPlan, User } from "@localito/shared";
import { api } from "./lib/api";

const emptyTenantForm = { businessName: "", businessType: "Almacén", ownerName: "", ownerEmail: "", ownerPassword: "" };
const emptyUserForm: { name: string; email: string; password: string; role: "owner" | "seller" } = { name: "", email: "", password: "", role: "seller" };

export function PlatformAdminView() {
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [editingUserId, setEditingUserId] = useState("");
  const [tenantSearch, setTenantSearch] = useState("");
  const [message, setMessage] = useState("Cargando administración de Localito...");
  const [busy, setBusy] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
  const visibleTenants = tenants.filter((tenant) => `${tenant.name} ${tenant.businessType}`.toLocaleLowerCase("es").includes(tenantSearch.trim().toLocaleLowerCase("es")));
  const totals = useMemo(() => {
    const subscriptions = tenants.map((tenant) => tenant.subscription).filter((subscription): subscription is Subscription => Boolean(subscription));
    const trials = subscriptions.filter((subscription) => subscription.status === "trialing");
    const completedTrials = subscriptions.filter((subscription) => subscription.trialStartedAt && subscription.status !== "trialing");
    const convertedTrials = completedTrials.filter((subscription) => subscription.status === "active");
    const lastThirtyDays = Date.now() - 30 * 86_400_000;
    return {
      activeTenants: tenants.filter((tenant) => tenant.active).length,
      users: tenants.reduce((sum, tenant) => sum + tenant.userCount, 0),
      products: tenants.reduce((sum, tenant) => sum + tenant.productCount, 0),
      trials: trials.length,
      newTrials: trials.filter((subscription) => new Date(subscription.createdAt).getTime() >= lastThirtyDays).length,
      basic: subscriptions.filter((subscription) => subscription.plan === "basic" && subscription.status === "active").length,
      pro: subscriptions.filter((subscription) => subscription.plan === "pro" && subscription.status === "active").length,
      expired: subscriptions.filter((subscription) => subscription.status === "expired" || subscription.status === "cancelled").length,
      pastDue: subscriptions.filter((subscription) => subscription.status === "past_due").length,
      conversion: completedTrials.length ? Math.round((convertedTrials.length / completedTrials.length) * 100) : 0,
      mrr: subscriptions.reduce((sum, subscription) => subscription.status === "active" ? sum + LOCALITO_PLANS[subscription.plan].price : sum, 0)
    };
  }, [tenants]);

  async function loadTenants(preferredTenantId?: string) {
    const response = await api.getPlatformTenants();
    setTenants(response.data);
    const nextId = preferredTenantId ?? selectedTenantId ?? response.data[0]?.id ?? "";
    setSelectedTenantId(response.data.some((tenant) => tenant.id === nextId) ? nextId : response.data[0]?.id ?? "");
    setMessage("Administración actualizada.");
  }

  async function loadUsers(tenantId: string) {
    if (!tenantId) { setUsers([]); return; }
    const response = await api.getPlatformTenantUsers(tenantId);
    setUsers(response.data);
  }

  useEffect(() => { void loadTenants().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudieron cargar los locales.")); }, []);
  useEffect(() => { void loadUsers(selectedTenantId).catch((error) => setMessage(error instanceof Error ? error.message : "No se pudieron cargar los usuarios.")); }, [selectedTenantId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo completar la operación."); } finally { setBusy(false); }
  }

  function createTenant() {
    void run(async () => {
      const response = await api.createPlatformTenant(tenantForm);
      setTenantForm(emptyTenantForm);
      await loadTenants(response.data.tenant.id);
      setMessage(`Local ${response.data.tenant.name} creado con su primer dueño.`);
    });
  }

  function createUser() {
    if (!selectedTenantId) return;
    void run(async () => {
      if (editingUserId) { await api.updatePlatformTenantUser(selectedTenantId, editingUserId, { name: userForm.name, email: userForm.email, role: userForm.role }); if (userForm.password) await api.resetPlatformTenantUserPassword(selectedTenantId, editingUserId, userForm.password); }
      else await api.createPlatformTenantUser(selectedTenantId, userForm);
      setUserForm(emptyUserForm);
      setEditingUserId("");
      await Promise.all([loadUsers(selectedTenantId), loadTenants(selectedTenantId)]);
      setMessage(editingUserId ? "Usuario actualizado." : "Usuario creado en el local seleccionado.");
    });
  }

  function toggleTenant(tenant: PlatformTenantSummary) {
    void run(async () => {
      await api.updatePlatformTenant(tenant.id, { active: !tenant.active });
      await loadTenants(tenant.id);
      setMessage(tenant.active ? "Local suspendido." : "Local reactivado.");
    });
  }

  function toggleUser(user: User) {
    if (!selectedTenantId) return;
    void run(async () => {
      await api.updatePlatformTenantUser(selectedTenantId, user.id, { active: user.active === false });
      await Promise.all([loadUsers(selectedTenantId), loadTenants(selectedTenantId)]);
      setMessage(user.active === false ? "Usuario reactivado." : "Usuario desactivado.");
    });
  }

  function updateSubscription(tenant: PlatformTenantSummary, payload: { plan?: SubscriptionPlan; status?: Subscription["status"] }) {
    void run(async () => {
      const response = await api.updatePlatformTenantSubscription(tenant.id, payload);
      setTenants((current) => current.map((item) => item.id === tenant.id ? { ...item, subscription: response.data } : item));
      await loadTenants(tenant.id);
      setMessage("Suscripción actualizada.");
    });
  }

  function editUser(user: User) {
    setEditingUserId(user.id);
    setUserForm({ name: user.name, email: user.email, role: user.role === "owner" ? "owner" : "seller", password: "" });
  }

  function deleteUser(user: User) {
    if (!selectedTenantId || !window.confirm(`¿Eliminar definitivamente a ${user.name}? Su historial de ventas se conservará sin vincular su acceso.`)) return;
    void run(async () => {
      await api.deletePlatformTenantUser(selectedTenantId, user.id);
      if (editingUserId === user.id) { setEditingUserId(""); setUserForm(emptyUserForm); }
      await Promise.all([loadUsers(selectedTenantId), loadTenants(selectedTenantId)]);
      setMessage("Usuario eliminado definitivamente.");
    });
  }

  function deleteTenant(tenant: PlatformTenantSummary) {
    const confirmation = window.prompt(`Esta acción elimina permanentemente ${tenant.name} y todos sus datos. Escribe ELIMINAR para continuar.`);
    if (confirmation !== "ELIMINAR") return;
    void run(async () => {
      await api.deletePlatformTenant(tenant.id);
      await loadTenants();
      setMessage(`Local ${tenant.name} eliminado definitivamente.`);
    });
  }

  return <div className="stack">
    <section className="panel hero-panel platform-admin-hero">
      <div className="hero-copy"><span>ADMINISTRACIÓN DE PLATAFORMA</span><strong>Control general de Localito</strong><p>Desde aquí creas locales y administras sus dueños y vendedores, sin mezclar este rol con la operación de caja.</p></div>
      <div className="hero-actions"><button className="secondary-action" type="button" onClick={() => void loadTenants()} disabled={busy}><RefreshCw size={18}/> Actualizar</button></div>
    </section>

    <section className="stats-grid">
      <article className="stat-card"><Store size={22}/><div><span>Locales activos</span><strong>{totals.activeTenants}</strong></div></article>
      <article className="stat-card"><Users size={22}/><div><span>Usuarios activos</span><strong>{totals.users}</strong></div></article>
      <article className="stat-card"><Package size={22}/><div><span>Productos registrados</span><strong>{totals.products}</strong></div></article>
      <article className="stat-card"><Clock3 size={22}/><div><span>Pruebas activas</span><strong>{totals.trials}</strong></div></article>
      <article className="stat-card"><WalletCards size={22}/><div><span>MRR estimado</span><strong>${totals.mrr.toLocaleString("es-CL")}</strong></div></article>
    </section>

    <section className="panel platform-subscription-summary" aria-labelledby="subscription-summary-title">
      <div className="section-heading"><div><span>MODELO SAAS</span><h2 id="subscription-summary-title">Suscripciones y conversión</h2></div><span>Actualizado con los locales visibles</span></div>
      <div className="report-grid">
        <div className="report-metric"><span>Basic activos</span><strong>{totals.basic}</strong></div>
        <div className="report-metric"><span>Pro activos</span><strong>{totals.pro}</strong></div>
        <div className="report-metric warning"><span>Pago pendiente</span><strong>{totals.pastDue}</strong></div>
        <div className="report-metric warning"><span>Expirados/cancelados</span><strong>{totals.expired}</strong></div>
        <div className="report-metric"><span>Nuevas pruebas (30 días)</span><strong>{totals.newTrials}</strong></div>
        <div className="report-metric"><span>Conversión prueba → pago</span><strong>{totals.conversion}%</strong></div>
      </div>
      <div className="platform-metric-notes"><span><TrendingUp size={17}/> Conversión calculada sobre pruebas finalizadas.</span><span><ShieldAlert size={17}/> Los pagos pendientes requieren activación manual.</span></div>
    </section>

    <section className="panel admin-create-panel"><div className="section-heading"><div><span>ALTAS</span><h2>Crear un nuevo local</h2></div><span>{message}</span></div><div className="form-grid">
      <label className="form-field"><span>Nombre del local</span><input value={tenantForm.businessName} onChange={(event) => setTenantForm({ ...tenantForm, businessName: event.target.value })} /></label>
      <label className="form-field"><span>Rubro</span><input value={tenantForm.businessType} onChange={(event) => setTenantForm({ ...tenantForm, businessType: event.target.value })} /></label>
      <label className="form-field"><span>Nombre del primer dueño</span><input value={tenantForm.ownerName} onChange={(event) => setTenantForm({ ...tenantForm, ownerName: event.target.value })} /></label>
      <label className="form-field"><span>Correo del dueño</span><input type="email" value={tenantForm.ownerEmail} onChange={(event) => setTenantForm({ ...tenantForm, ownerEmail: event.target.value })} /></label>
      <label className="form-field"><span>Clave inicial</span><input type="password" value={tenantForm.ownerPassword} onChange={(event) => setTenantForm({ ...tenantForm, ownerPassword: event.target.value })} minLength={10} autoComplete="new-password" /></label>
      <button className="primary-action" type="button" disabled={busy || !tenantForm.businessName || !tenantForm.ownerEmail || !tenantForm.ownerPassword} onClick={createTenant}><Plus size={18}/> Crear local y dueño</button>
    </div></section>

    <div className="workspace-grid">
      <section className="panel"><div className="section-heading"><div><span>NEGOCIOS</span><h2>Locales</h2></div><span>{tenants.length}</span></div><label className="form-field admin-search"><span>Buscar local</span><input value={tenantSearch} onChange={(event) => setTenantSearch(event.target.value)} placeholder="Nombre o rubro"/></label><div className="list">
        {visibleTenants.map((tenant) => <div className={`row platform-tenant-row ${tenant.id === selectedTenantId ? "selected-row" : ""}`} key={tenant.id}>
          <button className="row-main-button" type="button" onClick={() => setSelectedTenantId(tenant.id)}><Building2 size={20}/><span><strong>{tenant.name}</strong><small>{tenant.businessType} · {tenant.ownerCount} dueños · {tenant.userCount} usuarios · {tenant.productCount} productos</small><small>{tenant.subscription ? `${LOCALITO_PLANS[tenant.subscription.plan].name} · ${tenant.subscription.status}${tenant.subscription.status === "trialing" ? ` · ${subscriptionDaysRemaining(tenant.subscription)} días` : ""}${tenant.subscription.pendingPlan ? ` · solicita ${LOCALITO_PLANS[tenant.subscription.pendingPlan].name}` : ""}` : "Sin suscripción"}</small></span></button>
          {tenant.subscription && <div className="subscription-admin-controls"><select aria-label={`Plan de ${tenant.name}`} value={tenant.subscription.plan} onChange={(event) => updateSubscription(tenant, { plan: event.target.value as SubscriptionPlan })} disabled={busy}><option value="basic">Básico</option><option value="pro">Pro</option></select><select aria-label={`Estado de ${tenant.name}`} value={tenant.subscription.status} onChange={(event) => updateSubscription(tenant, { status: event.target.value as Subscription["status"] })} disabled={busy}><option value="trialing">Prueba</option><option value="active">Activo</option><option value="past_due">Pago pendiente</option><option value="expired">Vencido</option><option value="cancelled">Cancelado</option></select></div>}
          <span className={tenant.active ? "status-badge success" : "status-badge warning"}>{tenant.active ? "Activo" : "Suspendido"}</span>
          <button className="icon-button" type="button" onClick={() => toggleTenant(tenant)} aria-label={tenant.active ? "Suspender local" : "Reactivar local"}><Power size={18}/></button>
          <button className="icon-button danger" type="button" onClick={() => deleteTenant(tenant)} aria-label={`Eliminar ${tenant.name}`} disabled={busy}><Trash2 size={18}/></button>
        </div>)}
        {!tenants.length && <p className="empty-state">Todavía no existen locales.</p>}
      </div></section>

      <section className="panel"><div className="section-heading"><h2>Usuarios de {selectedTenant?.name ?? "un local"}</h2><span>{users.length}</span></div>
        {selectedTenant && <><div className="form-grid"><label className="form-field"><span>Nombre</span><input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })}/></label><label className="form-field"><span>Correo</span><input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })}/></label><label className="form-field"><span>{editingUserId ? "Nueva clave (opcional)" : "Clave inicial"}</span><input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} minLength={10} autoComplete="new-password"/></label><label className="form-field"><span>Rol</span><select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as "owner" | "seller" })}><option value="owner">Dueño</option><option value="seller">Vendedor</option></select></label><button className="primary-action" type="button" disabled={busy || !userForm.name || !userForm.email || (!editingUserId && !userForm.password)} onClick={createUser}>{editingUserId ? <Pencil size={18}/> : <Plus size={18}/>} {editingUserId ? "Guardar usuario" : "Crear usuario"}</button>{editingUserId && <button className="secondary-action" type="button" onClick={() => { setEditingUserId(""); setUserForm(emptyUserForm); }}>Cancelar edición</button>}</div>
        <div className="list">{users.map((user) => <div className="row platform-user-row" key={user.id}><div><strong>{user.name}</strong><p>{user.email} · {user.role === "owner" ? "Dueño" : "Vendedor"}</p></div><span className={user.active === false ? "status-badge warning" : "status-badge success"}>{user.active === false ? "Inactivo" : "Activo"}</span><div className="row-actions"><button className="icon-button" type="button" onClick={() => editUser(user)} aria-label={`Editar ${user.name}`} disabled={busy}><Pencil size={17}/></button><button className="secondary-action small" type="button" onClick={() => toggleUser(user)} disabled={busy}>{user.active === false ? "Reactivar" : "Desactivar"}</button><button className="icon-button danger" type="button" onClick={() => deleteUser(user)} aria-label={`Eliminar ${user.name}`} disabled={busy}><Trash2 size={17}/></button></div></div>)}</div></>}
      </section>
    </div>
  </div>;
}
