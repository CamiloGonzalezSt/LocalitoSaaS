export type SubscriptionPlan = "basic" | "pro";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "expired" | "cancelled";

export type EntitlementKey =
  | "sales"
  | "inventory"
  | "products"
  | "cashRegister"
  | "imports"
  | "customers"
  | "credit"
  | "suppliers"
  | "purchases"
  | "advancedReports"
  | "audit"
  | "alerts"
  | "aiPhotoSale"
  | "advancedAnalytics";

export interface Subscription {
  id: string;
  tenantId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trialStartedAt?: string;
  trialEndsAt?: string;
  currentPeriodStartedAt?: string;
  currentPeriodEndsAt?: string;
  cancelledAt?: string;
  paymentProvider?: string;
  externalCustomerId?: string;
  externalSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlanDefinition {
  id: SubscriptionPlan;
  name: string;
  price: number;
  description: string;
  recommended?: boolean;
  entitlements: EntitlementKey[];
}

const basicEntitlements: EntitlementKey[] = ["sales", "inventory", "products", "cashRegister", "imports"];
const proEntitlements: EntitlementKey[] = [
  ...basicEntitlements,
  "customers",
  "credit",
  "suppliers",
  "purchases",
  "advancedReports",
  "audit",
  "alerts",
  "aiPhotoSale",
  "advancedAnalytics"
];

export const LOCALITO_PLANS: Record<SubscriptionPlan, PlanDefinition> = {
  basic: {
    id: "basic",
    name: "Localito Básico",
    price: 9_990,
    description: "Lo esencial para vender, ordenar inventario y controlar la caja.",
    entitlements: basicEntitlements
  },
  pro: {
    id: "pro",
    name: "Localito Pro",
    price: 19_990,
    description: "Gestión completa con clientes, fiado, compras, reportes e inteligencia visual.",
    recommended: true,
    entitlements: proEntitlements
  }
};

export function subscriptionDaysRemaining(subscription: Subscription, now = new Date()) {
  const end = subscription.status === "trialing" ? subscription.trialEndsAt : subscription.currentPeriodEndsAt;
  if (!end) return 0;
  return Math.max(0, Math.ceil((new Date(end).getTime() - now.getTime()) / 86_400_000));
}

export function effectiveSubscriptionStatus(subscription: Subscription, now = new Date()): SubscriptionStatus {
  if (subscription.status === "trialing" && subscription.trialEndsAt && new Date(subscription.trialEndsAt) <= now) return "expired";
  if (subscription.status === "active" && subscription.currentPeriodEndsAt && new Date(subscription.currentPeriodEndsAt) <= now) return "expired";
  return subscription.status;
}

export function subscriptionEntitlements(subscription: Subscription) {
  const status = effectiveSubscriptionStatus(subscription);
  if (status === "expired" || status === "cancelled" || status === "past_due") return [] as EntitlementKey[];
  return [...LOCALITO_PLANS[subscription.plan].entitlements];
}

export function subscriptionCanMutate(subscription: Subscription) {
  return ["trialing", "active"].includes(effectiveSubscriptionStatus(subscription));
}

export function hasEntitlement(subscription: Subscription, entitlement: EntitlementKey) {
  return subscriptionEntitlements(subscription).includes(entitlement);
}

export function createTrialSubscription(tenantId: string, now = new Date()): Subscription {
  const trialEndsAt = new Date(now.getTime() + 30 * 86_400_000);
  return {
    id: crypto.randomUUID(),
    tenantId,
    plan: "pro",
    status: "trialing",
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEndsAt.toISOString(),
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };
}
