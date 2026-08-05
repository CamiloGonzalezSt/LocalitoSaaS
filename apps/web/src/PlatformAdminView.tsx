import { useEffect, useMemo, useState } from "react";
import { Building2, Package, Plus, Power, RefreshCw, ShieldCheck, Store, Users } from "lucide-react";
import type { PlatformTenantSummary, User } from "@localito/shared";
import { api } from "./lib/api";

const emptyTenantForm = { businessName: "", businessType: "Almacén", ownerName: "", ownerEmail: "", ownerPassword: "" };
const emptyUserForm: { name: string; email: string; password: string; role: "owner" | "seller" } = { name: "", email: "", password: "", role: "seller" };

export function PlatformAdminView() {
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [tenantForm, setTenantForm] = useState(emptyTenantForm);
  const [userForm, setUserForm] = useState(emptyUserForm);
  const [message, setMessage] = useState("Cargando administración de Localito...");
  const [busy, setBusy] = useState(false);

  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);
  const totals = useMemo(() => ({
    activeTenants: tenants.filter((tenant) => tenant.active).length,
    users: tenants.reduce((sum, tenant) => sum + tenant.userCount, 0),
    products: tenants.reduce((sum, tenant) => sum + tenant.productCount, 0)
  }), [tenants]);

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
      await api.createPlatformTenantUser(selectedTenantId, userForm);
      setUserForm(emptyUserForm);
      await Promise.all([loadUsers(selectedTenantId), loadTenants(selectedTenantId)]);
      setMessage("Usuario creado en el local seleccionado.");
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

  return <div className="stack">
    <section className="panel hero-panel platform-admin-hero">
      <div className="hero-copy"><span>ADMINISTRACIÓN DE PLATAFORMA</span><strong>Control general de Localito</strong><p>Desde aquí creas locales y administras sus dueños y vendedores, sin mezclar este rol con la operación de caja.</p></div>
      <div className="hero-actions"><button className="secondary-action" type="button" onClick={() => void loadTenants()} disabled={busy}><RefreshCw size={18}/> Actualizar</button></div>
    </section>

    <section className="stats-grid">
      <article className="stat-card"><Store size={22}/><div><span>Locales activos</span><strong>{totals.activeTenants}</strong></div></article>
      <article className="stat-card"><Users size={22}/><div><span>Usuarios activos</span><strong>{totals.users}</strong></div></article>
      <article className="stat-card"><Package size={22}/><div><span>Productos registrados</span><strong>{totals.products}</strong></div></article>
      <article className="stat-card"><ShieldCheck size={22}/><div><span>Tu perfil</span><strong>Admin</strong></div></article>
    </section>

    <section className="panel"><div className="section-heading"><h2>Crear un nuevo local</h2><span>{message}</span></div><div className="form-grid">
      <input value={tenantForm.businessName} onChange={(event) => setTenantForm({ ...tenantForm, businessName: event.target.value })} placeholder="Nombre del local" />
      <input value={tenantForm.businessType} onChange={(event) => setTenantForm({ ...tenantForm, businessType: event.target.value })} placeholder="Rubro" />
      <input value={tenantForm.ownerName} onChange={(event) => setTenantForm({ ...tenantForm, ownerName: event.target.value })} placeholder="Nombre del primer dueño" />
      <input type="email" value={tenantForm.ownerEmail} onChange={(event) => setTenantForm({ ...tenantForm, ownerEmail: event.target.value })} placeholder="Correo del dueño" />
      <input type="password" value={tenantForm.ownerPassword} onChange={(event) => setTenantForm({ ...tenantForm, ownerPassword: event.target.value })} placeholder="Clave inicial (mínimo 10 caracteres)" />
      <button className="primary-action" type="button" disabled={busy || !tenantForm.businessName || !tenantForm.ownerEmail || !tenantForm.ownerPassword} onClick={createTenant}><Plus size={18}/> Crear local y dueño</button>
    </div></section>

    <div className="workspace-grid">
      <section className="panel"><div className="section-heading"><h2>Locales</h2><span>{tenants.length}</span></div><div className="list">
        {tenants.map((tenant) => <div className={`row ${tenant.id === selectedTenantId ? "selected-row" : ""}`} key={tenant.id}>
          <button className="row-main-button" type="button" onClick={() => setSelectedTenantId(tenant.id)}><Building2 size={20}/><span><strong>{tenant.name}</strong><small>{tenant.businessType} · {tenant.ownerCount} dueños · {tenant.userCount} usuarios · {tenant.productCount} productos</small></span></button>
          <span className={tenant.active ? "status-badge success" : "status-badge warning"}>{tenant.active ? "Activo" : "Suspendido"}</span>
          <button className="icon-button" type="button" onClick={() => toggleTenant(tenant)} aria-label={tenant.active ? "Suspender local" : "Reactivar local"}><Power size={18}/></button>
        </div>)}
        {!tenants.length && <p className="empty-state">Todavía no existen locales.</p>}
      </div></section>

      <section className="panel"><div className="section-heading"><h2>Usuarios de {selectedTenant?.name ?? "un local"}</h2><span>{users.length}</span></div>
        {selectedTenant && <><div className="form-grid"><input value={userForm.name} onChange={(event) => setUserForm({ ...userForm, name: event.target.value })} placeholder="Nombre"/><input type="email" value={userForm.email} onChange={(event) => setUserForm({ ...userForm, email: event.target.value })} placeholder="Correo"/><input type="password" value={userForm.password} onChange={(event) => setUserForm({ ...userForm, password: event.target.value })} placeholder="Clave inicial"/><select value={userForm.role} onChange={(event) => setUserForm({ ...userForm, role: event.target.value as "owner" | "seller" })}><option value="owner">Dueño</option><option value="seller">Vendedor</option></select><button className="primary-action" type="button" disabled={busy || !userForm.name || !userForm.email || !userForm.password} onClick={createUser}><Plus size={18}/> Crear usuario</button></div>
        <div className="list">{users.map((user) => <div className="row" key={user.id}><div><strong>{user.name}</strong><p>{user.email} · {user.role === "owner" ? "Dueño" : "Vendedor"}</p></div><span className={user.active === false ? "status-badge warning" : "status-badge success"}>{user.active === false ? "Inactivo" : "Activo"}</span><button className="secondary-action small" type="button" onClick={() => toggleUser(user)} disabled={busy}>{user.active === false ? "Reactivar" : "Desactivar"}</button></div>)}</div></>}
      </section>
    </div>
  </div>;
}
