import type { Customer, Product, Sale } from "@localito/shared";

export const tenantId = "00000000-0000-4000-8000-000000000001";

export const initialProducts: Product[] = [
  {
    id: "prod-coca-15",
    tenantId,
    name: "Coca-Cola 1.5L",
    brand: "Coca-Cola",
    category: "Bebidas",
    barcode: "7801610001347",
    costPrice: 1200,
    salePrice: 1800,
    stock: 12,
    minimumStock: 5,
    active: true
  },
  {
    id: "prod-pan-molde",
    tenantId,
    name: "Pan de molde integral",
    brand: "Ideal",
    category: "Panaderia",
    barcode: "7801234567890",
    costPrice: 1500,
    salePrice: 2300,
    stock: 3,
    minimumStock: 6,
    active: true
  },
  {
    id: "prod-shampoo",
    tenantId,
    name: "Shampoo familiar 750ml",
    brand: "Sedal",
    category: "Aseo personal",
    barcode: "7802222222222",
    costPrice: 2800,
    salePrice: 4200,
    stock: 9,
    minimumStock: 4,
    active: true
  },
  {
    id: "prod-arroz",
    tenantId,
    name: "Arroz grado 2 1kg",
    brand: "Tucapel",
    category: "Abarrotes",
    barcode: "7803333333333",
    costPrice: 900,
    salePrice: 1400,
    stock: 18,
    minimumStock: 8,
    active: true
  },
  {
    id: "prod-detergente",
    tenantId,
    name: "Detergente liquido 1L",
    brand: "Omo",
    category: "Aseo hogar",
    barcode: "7804444444444",
    costPrice: 2600,
    salePrice: 3900,
    stock: 2,
    minimumStock: 4,
    active: true
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "cust-ana",
    tenantId,
    name: "Ana Riquelme",
    phone: "+56 9 8765 4321",
    debtBalance: 14500,
    active: true
  },
  {
    id: "cust-juan",
    tenantId,
    name: "Juan Perez",
    phone: "+56 9 1122 3344",
    debtBalance: 6200,
    active: true
  },
  {
    id: "cust-marta",
    tenantId,
    name: "Marta Leiva",
    phone: "+56 9 5555 2211",
    debtBalance: 0,
    active: true
  }
];

export const initialSales: Sale[] = [
  {
    id: "sale-001",
    tenantId,
    sellerId: "user-demo-seller",
    items: [
      {
        productId: "prod-coca-15",
        productName: "Coca-Cola 1.5L",
        quantity: 2,
        unitPrice: 1800,
        subtotal: 3600
      }
    ],
    total: 3600,
    paymentMethod: "cash",
    paymentStatus: "approved",
    saleType: "normal",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "sale-002",
    tenantId,
    sellerId: "user-demo-seller",
    customerId: "cust-ana",
    items: [
      {
        productId: "prod-pan-molde",
        productName: "Pan de molde integral",
        quantity: 1,
        unitPrice: 2300,
        subtotal: 2300
      }
    ],
    total: 2300,
    paymentMethod: "credit",
    paymentStatus: "approved",
    saleType: "credit",
    status: "active",
    createdAt: new Date().toISOString()
  }
];
