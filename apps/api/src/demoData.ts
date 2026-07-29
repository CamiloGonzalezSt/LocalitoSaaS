import type { Product, User } from "@localito/shared";

type DemoUserSeed = {
  id: string;
  name: string;
  email: string;
  role: User["role"];
};

type DemoProductSeed = {
  id?: string;
  name: string;
  brand?: string;
  salePrice: number;
  costPrice?: number;
  barcode?: string;
  stock?: number;
  minimumStock?: number;
};

type ProductGroup = {
  category: string;
  items: DemoProductSeed[];
};

const demoUsers: DemoUserSeed[] = [
  {
    id: "00000000-0000-4000-8000-000000000101",
    name: "Caj Gonzalez",
    email: "caj.gonzalezs@duocuc.cl",
    role: "owner"
  },
  {
    id: "00000000-0000-4000-8000-000000000102",
    name: "Sam Solis",
    email: "sam.solis@duocuc.cl",
    role: "owner"
  },
  {
    id: "00000000-0000-4000-8000-000000000103",
    name: "Al Patino",
    email: "al.patino@duocuc.cl",
    role: "owner"
  },
  {
    id: "00000000-0000-4000-8000-000000000201",
    name: "Caj Gonzalez Vendedor",
    email: "caj.gonzalezs+vendedor@duocuc.cl",
    role: "seller"
  },
  {
    id: "00000000-0000-4000-8000-000000000202",
    name: "Sam Solis Vendedor",
    email: "sam.solis+vendedor@duocuc.cl",
    role: "seller"
  },
  {
    id: "00000000-0000-4000-8000-000000000203",
    name: "Al Patino Vendedor",
    email: "al.patino+vendedor@duocuc.cl",
    role: "seller"
  }
];

const productGroups: ProductGroup[] = [
  {
    category: "Bebidas y jugos",
    items: [
      { id: "prod-coca-15", name: "Bebida Original Botella 1,5 L", brand: "Coca-Cola", salePrice: 2150, costPrice: 1600, barcode: "7801610001347", stock: 28, minimumStock: 8 },
      { name: "Bebida Sin Azucar Botella 1,5 L", brand: "Coca-Cola", salePrice: 2150 },
      { name: "Bebida Light Botella 1,5 L", brand: "Coca-Cola", salePrice: 2150 },
      { name: "Bebida Original Botella 2 L", brand: "Coca-Cola", salePrice: 2000 },
      { name: "Bebida Original Pack 6 Latas 350 ml", brand: "Coca-Cola", salePrice: 4150 },
      { name: "Bebida Cola Retornable 2,5 L", brand: "Pepsi", salePrice: 1490 },
      { name: "Bebida Zero Cola Retornable 2,5 L", brand: "Pepsi", salePrice: 1490 },
      { name: "Bebida Naranja Botella 1,5 L", brand: "Fanta", salePrice: 1890 },
      { name: "Bebida Lima Limon Botella 1,5 L", brand: "Sprite", salePrice: 1890 },
      { name: "Agua Mineral Sin Gas Botella 1,6 L", brand: "Cachantun", salePrice: 990 },
      { name: "Agua Mineral Con Gas Botella 1,6 L", brand: "Cachantun", salePrice: 990 },
      { name: "Agua Purificada Bidon 6 L", brand: "Lider", salePrice: 1590 },
      { name: "Nectar Durazno Caja 1,5 L", brand: "Watts", salePrice: 1890 },
      { name: "Nectar Naranja Caja 1,5 L", brand: "Watts", salePrice: 1890 },
      { name: "Nectar Pina Coco 1,6 L", brand: "Watts", salePrice: 5590 },
      { name: "Jugo Naranja 1,5 L", brand: "Guallarauco", salePrice: 4950 },
      { name: "Jugo Mango 1,5 L", brand: "Guallarauco", salePrice: 4950 },
      { name: "Bebida Vegetal Coco 1 L", brand: "Vilay", salePrice: 2390 },
      { name: "Bebida Vegetal Chocolate 1 L", brand: "Vilay", salePrice: 2390 },
      { name: "Bebida Vegetal Almendra Coco 1 L", brand: "Tasty", salePrice: 1490 },
      { name: "Energetica Original Lata 473 ml", brand: "Monster", salePrice: 1990 },
      { name: "Energetica Red Edition Lata 250 ml", brand: "Red Bull", salePrice: 1690 },
      { name: "Te Helado Durazno Botella 1,5 L", brand: "Lipton", salePrice: 1990 },
      { name: "Te Helado Limon Botella 1,5 L", brand: "Lipton", salePrice: 1990 }
    ]
  },
  {
    category: "Abarrotes",
    items: [
      { id: "prod-arroz", name: "Arroz Grado 2 Grano Largo Bolsa 1 kg", brand: "Tucapel", salePrice: 1190, costPrice: 850, stock: 32, minimumStock: 10 },
      { name: "Arroz Grado 1 Grano Largo Bolsa 1 kg", brand: "Tucapel", salePrice: 2351 },
      { name: "Arroz Integral Grado 1 Bolsa 1 kg", brand: "Tucapel", salePrice: 2750 },
      { name: "Arroz Grado 1 Grano Largo Bolsa 1 kg", brand: "Miraflores", salePrice: 2000 },
      { name: "Arroz Grado 1 Grano Largo Bolsa 2 kg", brand: "Banquete", salePrice: 3250 },
      { name: "Arroz Grado 2 Grano Largo Bolsa 1 kg", brand: "Lider", salePrice: 1190 },
      { name: "Arroz Grado 1 Grano Largo Bolsa 1 kg", brand: "Lider", salePrice: 1890 },
      { name: "Arroz Basmati Bolsa 400 g", brand: "Lider", salePrice: 1790 },
      { name: "Lentejas 7 mm Bolsa 500 g", brand: "Martini", salePrice: 1790 },
      { name: "Porotos Blancos Bolsa 500 g", brand: "Martini", salePrice: 1890 },
      { name: "Garbanzos Bolsa 500 g", brand: "Martini", salePrice: 1690 },
      { name: "Harina Sin Polvos Bolsa 1 kg", brand: "Selecta", salePrice: 1390 },
      { name: "Harina Con Polvos Bolsa 1 kg", brand: "Selecta", salePrice: 1490 },
      { name: "Azucar Granulada Bolsa 1 kg", brand: "Iansa", salePrice: 1590 },
      { name: "Endulzante Sucralosa 200 Tabletas", brand: "Daily", salePrice: 2390 },
      { name: "Aceite Maravilla Botella 900 ml", brand: "Chef", salePrice: 2590 },
      { name: "Aceite Vegetal Botella 900 ml", brand: "Lider", salePrice: 2190 },
      { name: "Aceite Oliva Extra Virgen 500 ml", brand: "Carbonell", salePrice: 5990 },
      { name: "Sal Fina Bolsa 1 kg", brand: "Lobos", salePrice: 790 },
      { name: "Salsa de Tomate Italiana Caja 200 g", brand: "Carozzi", salePrice: 590 },
      { name: "Salsa de Tomate Natural Caja 200 g", brand: "Carozzi", salePrice: 590 },
      { name: "Pure de Tomate Caja 200 g", brand: "Lider", salePrice: 490 },
      { name: "Atun Lomitos Agua Lata 160 g", brand: "San Jose", salePrice: 1690 },
      { name: "Atun Lomitos Aceite Lata 160 g", brand: "San Jose", salePrice: 1690 },
      { name: "Jurel Natural Lata 425 g", brand: "San Jose", salePrice: 2390 },
      { name: "Sardinas Salsa Tomate Lata 125 g", brand: "Robinson Crusoe", salePrice: 1190 },
      { name: "Duraznos en Mitades Lata 590 g", brand: "Wasil", salePrice: 1990 },
      { name: "Choclo Grano Dulce Lata 340 g", brand: "Wasil", salePrice: 1390 },
      { name: "Arvejas Lata 340 g", brand: "Lider", salePrice: 990 },
      { name: "Palmitos Rodajas Frasco 400 g", brand: "Lider", salePrice: 2290 }
    ]
  },
  {
    category: "Pastas y sopas",
    items: [
      { name: "Fideo Pasta Tallarines N 87 Bolsa 400 g", brand: "Carozzi", salePrice: 1050 },
      { name: "Fideo Pasta Espirales N 49 Bolsa 400 g", brand: "Carozzi", salePrice: 1050 },
      { name: "Fideo Pasta Espiral N 49 Bolsa 1 kg", brand: "Carozzi", salePrice: 2390 },
      { name: "Fideo Pasta Cabellitos Bolsa 400 g", brand: "Lucchetti", salePrice: 1030 },
      { name: "Fideo Pasta Caracolitos N 35 Bolsa 250 g", brand: "Lucchetti", salePrice: 810 },
      { name: "Fideo Pasta Mariposas N 81 Bolsa 250 g", brand: "Lucchetti", salePrice: 810 },
      { name: "Fideo Pasta Rigati N 48 Bolsa 400 g", brand: "Lucchetti", salePrice: 1030 },
      { name: "Fideo Pasta Tallarines N 77 Bolsa 400 g", brand: "Lider", salePrice: 760 },
      { name: "Fideo Pasta Espirales Bolsa 400 g", brand: "Lider", salePrice: 760 },
      { name: "Fideo Pasta Spirali Bolsa 400 g", brand: "Seleccion", salePrice: 1290 },
      { name: "Fideo Pasta Farfalle Bolsa 400 g", brand: "Seleccion", salePrice: 1290 },
      { name: "Fideo Pasta Bavette N 13 Caja 500 g", brand: "Barilla", salePrice: 2450 },
      { name: "Pasta Fideos Instantaneos Ramen Carne 85 g", brand: "Great Value", salePrice: 590 },
      { name: "Pasta Fideos Instantaneos Ramen Pollo 85 g", brand: "Great Value", salePrice: 590 },
      { name: "Pasta Fideos Instantaneos Ramen Carne 85 g", brand: "Nissin", salePrice: 690 },
      { name: "Pasta Fideos Instantaneos Ramen Pollo 85 g", brand: "Nissin", salePrice: 690 },
      { name: "Sopa Sabor Pollo Con Fideos Sobre 70 g", brand: "Gourmet", salePrice: 590 },
      { name: "Sopa Sabor Costilla Con Fideos Sobre 62 g", brand: "Gourmet", salePrice: 590 },
      { name: "Sopa Sabor Carne Con Fideos Sobre 60 g", brand: "Maggi", salePrice: 630 },
      { name: "Sopa Sabor Pollo Con Fideos Sobre 70 g", brand: "Maggi", salePrice: 630 },
      { name: "Fideos de Arroz Bolsa 220 g", brand: "Lider", salePrice: 1490 },
      { name: "Fideos de Arroz Rice Vermicelli Caja 375 g", brand: "Real Thai", salePrice: 2990 }
    ]
  },
  {
    category: "Lacteos y frescos",
    items: [
      { name: "Leche Semidescremada Caja 200 ml", brand: "Soprole", salePrice: 580 },
      { name: "Leche Semidescremada Caja 1 L", brand: "Soprole", salePrice: 1250 },
      { name: "Leche Sin Lactosa Descremada Caja 1 L", brand: "Soprole", salePrice: 1250 },
      { name: "Leche Sin Lactosa Semidescremada Caja 1 L", brand: "Soprole", salePrice: 1250 },
      { name: "Leche Descremada Sin Lactosa Caja 1 L", brand: "Colun", salePrice: 1390 },
      { name: "Leche Entera Sin Lactosa Caja 1 L", brand: "Colun", salePrice: 1390 },
      { name: "Leche Natural Descremada Caja 1 L", brand: "Loncoleche", salePrice: 1190 },
      { name: "Leche Semidescremada Sin Lactosa Caja 1 L", brand: "Loncoleche", salePrice: 1390 },
      { name: "Leche Semidescremada Caja 1 L", brand: "Lider", salePrice: 1090 },
      { name: "Leche Entera Caja 1 L", brand: "Lider", salePrice: 1090 },
      { name: "Leche Semidescremada Sin Lactosa Caja 1 L", brand: "Lider", salePrice: 1190 },
      { name: "Leche Descremada Caja 1 L", brand: "Surlat", salePrice: 1090 },
      { name: "Leche Semidescremada Sin Lactosa Caja 1 L", brand: "Surlat", salePrice: 1350 },
      { name: "Leche Cultivada Frutilla 510 ml", brand: "Soprole", salePrice: 1750 },
      { name: "Leche Cultivada Tradicional 510 ml", brand: "Soprole", salePrice: 1750 },
      { name: "Leche Cultivada Sabor Frutilla 1 L", brand: "Soprole", salePrice: 2490 },
      { name: "Leche Cultivada Sabor Vainilla 1 L", brand: "Soprole", salePrice: 2490 },
      { name: "Yogurt Batido Frutilla 1 kg", brand: "Soprole", salePrice: 2190 },
      { name: "Yogurt Batido Vainilla 1 kg", brand: "Soprole", salePrice: 2190 },
      { name: "Yogurt Protein Berries 900 g", brand: "Loncoleche", salePrice: 3250 },
      { name: "Yogurt Light Frutilla 900 g", brand: "Loncoleche", salePrice: 2590 },
      { name: "Queso Gauda Laminado 250 g", brand: "Colun", salePrice: 3190 },
      { name: "Quesillo Tradicional 320 g", brand: "Colun", salePrice: 2390 },
      { name: "Mantequilla Con Sal 250 g", brand: "Colun", salePrice: 2890 },
      { name: "Margarina Pan 250 g", brand: "Dorina", salePrice: 1190 },
      { name: "Manjar Bolsa 1 kg", brand: "Colun", salePrice: 3990 },
      { name: "Postre Arroz Con Leche 130 g", brand: "Soprole", salePrice: 730 },
      { name: "Crema Larga Vida Caja 200 ml", brand: "Soprole", salePrice: 1190 }
    ]
  },
  {
    category: "Panaderia y desayuno",
    items: [
      { id: "prod-pan-molde", name: "Pan de Molde Integral Bolsa 580 g", brand: "Ideal", salePrice: 2390, costPrice: 1750, stock: 3, minimumStock: 6 },
      { name: "Pan de Molde Blanco Bolsa 580 g", brand: "Ideal", salePrice: 2290 },
      { name: "Pan Hot Dog Bolsa 8 Un", brand: "Ideal", salePrice: 1890 },
      { name: "Pan Hamburguesa Bolsa 8 Un", brand: "Ideal", salePrice: 1890 },
      { name: "Hallulla Envasada Bolsa 6 Un", brand: "Lider", salePrice: 1690 },
      { name: "Marraqueta Envasada Bolsa 6 Un", brand: "Lider", salePrice: 1490 },
      { name: "Avena Instantanea Bolsa 800 g", brand: "Quaker", salePrice: 2490 },
      { name: "Avena Tradicional Bolsa 750 g", brand: "Lider", salePrice: 1690 },
      { name: "Cereal Chocolate Caja 330 g", brand: "Chocapic", salePrice: 3990 },
      { name: "Cereal Hojuelas Azucaradas Caja 500 g", brand: "Zucaritas", salePrice: 4290 },
      { name: "Granola Tradicional Bolsa 400 g", brand: "Lider", salePrice: 2490 },
      { name: "Cafe Instantaneo Frasco 170 g", brand: "Nescafe", salePrice: 5990 },
      { name: "Cafe Instantaneo Frasco 100 g", brand: "Lider", salePrice: 2990 },
      { name: "Te Ceylan 100 Bolsitas", brand: "Supremo", salePrice: 2890 },
      { name: "Te Ceylan 100 Bolsitas", brand: "Lider", salePrice: 1990 },
      { name: "Mermelada Frutilla Frasco 250 g", brand: "Wasil", salePrice: 1690 },
      { name: "Mermelada Damasco Frasco 250 g", brand: "Wasil", salePrice: 1690 },
      { name: "Miel Multifloral Frasco 500 g", brand: "Lider", salePrice: 3990 },
      { name: "Crema de Mani Frasco 350 g", brand: "Great Value", salePrice: 2990 },
      { name: "Cacao en Polvo Bolsa 350 g", brand: "Trencito", salePrice: 3190 }
    ]
  },
  {
    category: "Snacks y dulces",
    items: [
      { name: "Papas Fritas Original Bolsa 230 g", brand: "Evercrisp", salePrice: 2990 },
      { name: "Papas Fritas Corte Americano Bolsa 230 g", brand: "Marco Polo", salePrice: 2790 },
      { name: "Sufles Queso Bolsa 200 g", brand: "Evercrisp", salePrice: 2490 },
      { name: "Ramitas Queso Bolsa 230 g", brand: "Evercrisp", salePrice: 2490 },
      { name: "Mani Salado Bolsa 180 g", brand: "Marco Polo", salePrice: 1890 },
      { name: "Mani Japones Bolsa 180 g", brand: "Marco Polo", salePrice: 1990 },
      { name: "Galletas Triton Chocolate 126 g", brand: "Costa", salePrice: 890 },
      { name: "Galletas Frac Chocolate 130 g", brand: "Costa", salePrice: 890 },
      { name: "Galletas Vino Bolsa 160 g", brand: "McKay", salePrice: 990 },
      { name: "Galletas Soda Pack 210 g", brand: "Selz", salePrice: 1090 },
      { name: "Chocolate Sahne-Nuss Barra 250 g", brand: "Nestle", salePrice: 3990 },
      { name: "Chocolate Trencito Barra 150 g", brand: "Nestle", salePrice: 2190 },
      { name: "Chocolate Costa Rama 120 g", brand: "Costa", salePrice: 1890 },
      { name: "Caramelos Masticables Bolsa 430 g", brand: "Ambrosoli", salePrice: 2490 },
      { name: "Gomitas Frugeles Bolsa 400 g", brand: "Ambrosoli", salePrice: 2790 },
      { name: "Alfajor Chocolate 50 g", brand: "Game", salePrice: 590 },
      { name: "Barra Cereal Frutilla 6 Un", brand: "Costa", salePrice: 2290 },
      { name: "Cereal Bar Chocolate 6 Un", brand: "Quaker", salePrice: 2690 },
      { name: "Helado Cassata Familiar 1 L", brand: "Savory", salePrice: 3490 },
      { name: "Helado Trisabor 1 L", brand: "Lider", salePrice: 2490 },
      { name: "Cabritas Mantequilla Microondas 3 Un", brand: "Act II", salePrice: 1990 },
      { name: "Nachos Queso Bolsa 200 g", brand: "Doritos", salePrice: 2790 }
    ]
  },
  {
    category: "Congelados",
    items: [
      { name: "Camarones Pequenos Pelados Cocidos 500 g", brand: "Lider", salePrice: 7490 },
      { name: "Camarones Pequenos Pelados Cocidos 1 kg", brand: "Lider", salePrice: 13990 },
      { name: "Camarones Medianos Pelados Con Cola 500 g", brand: "Lider", salePrice: 7490 },
      { name: "Papas Prefritas Bolsa 1 kg", brand: "Lider", salePrice: 2990 },
      { name: "Papas Duquesas Bolsa 1 kg", brand: "Frutos del Maipo", salePrice: 3490 },
      { name: "Verduras Primavera Bolsa 500 g", brand: "Frutos del Maipo", salePrice: 1890 },
      { name: "Choclo Congelado Bolsa 500 g", brand: "Frutos del Maipo", salePrice: 1790 },
      { name: "Hamburguesas Vacuno 4 Un", brand: "La Crianza", salePrice: 4990 },
      { name: "Nuggets Pollo Bolsa 700 g", brand: "Super Pollo", salePrice: 3990 },
      { name: "Pizza Familiar Pepperoni", brand: "Lider", salePrice: 3990 },
      { name: "Pizza Familiar Jamon Queso", brand: "Lider", salePrice: 3990 },
      { name: "Empanadas Queso 6 Un", brand: "Lider", salePrice: 3490 },
      { name: "Helado Paleta Chocolate 6 Un", brand: "Savory", salePrice: 3490 },
      { name: "Berries Congelados Bolsa 500 g", brand: "Lider", salePrice: 3990 },
      { name: "Frutillas Congeladas Bolsa 500 g", brand: "Lider", salePrice: 2990 }
    ]
  },
  {
    category: "Limpieza hogar",
    items: [
      { id: "prod-detergente", name: "Detergente Liquido Ultra Power Aloe Vera 3 L", brand: "Omo", salePrice: 8480, costPrice: 6100, stock: 2, minimumStock: 4 },
      { name: "Detergente En Polvo Ultra Power Bolsa 2,7 kg", brand: "Omo", salePrice: 8950 },
      { name: "Detergente Liquido Ultra Power Piel Sensible 3 L", brand: "Omo", salePrice: 11850 },
      { name: "Detergente Liquido Doble Poder Botella 3 L", brand: "Ariel", salePrice: 12990 },
      { name: "Detergente En Polvo Doble Poder 680 g", brand: "Ariel", salePrice: 2000 },
      { name: "Detergente En Polvo Flores Primavera 10 kg", brand: "Lider", salePrice: 12990 },
      { name: "Detergente Liquido Flores Primavera 5 L", brand: "Lider", salePrice: 4990 },
      { name: "Lavalozas Limon Botella 750 ml", brand: "Quix", salePrice: 1990 },
      { name: "Lavalozas Concentrado Botella 500 ml", brand: "Quix", salePrice: 1490 },
      { name: "Cloro Tradicional Botella 2 L", brand: "Clorinda", salePrice: 1290 },
      { name: "Cloro Gel Botella 900 ml", brand: "Clorox", salePrice: 1690 },
      { name: "Limpiador Piso Lavanda 900 ml", brand: "Poett", salePrice: 1590 },
      { name: "Limpiador Piso Primavera 900 ml", brand: "Poett", salePrice: 1590 },
      { name: "Desinfectante Aerosol 360 ml", brand: "Lysol", salePrice: 3990 },
      { name: "Limpia Vidrios Gatillo 500 ml", brand: "Virginia", salePrice: 1990 },
      { name: "Suavizante Diluido 1,5 L", brand: "Comfort", salePrice: 2990 },
      { name: "Toalla Papel Doble Hoja 2 Rollos", brand: "Nova", salePrice: 2390 },
      { name: "Papel Higienico Doble Hoja 12 Rollos", brand: "Elite", salePrice: 5990 },
      { name: "Papel Higienico Doble Hoja 8 Rollos", brand: "Confort", salePrice: 4990 },
      { name: "Servilletas Blancas 100 Un", brand: "Elite", salePrice: 1190 },
      { name: "Bolsas Basura 50 L 10 Un", brand: "Virutex", salePrice: 1790 },
      { name: "Esponja Fibra Verde 3 Un", brand: "Virutex", salePrice: 1190 },
      { name: "Guantes Multiuso Talla M", brand: "Virutex", salePrice: 1590 },
      { name: "Tabletas Lavavajillas Quantum 60 Un", brand: "Finish", salePrice: 19850 }
    ]
  },
  {
    category: "Aseo personal",
    items: [
      { id: "prod-shampoo", name: "Shampoo Liso Perfecto 340 ml", brand: "Sedal", salePrice: 2000, costPrice: 1450, stock: 12, minimumStock: 4 },
      { name: "Shampoo Largo Increible", brand: "Ballerina", salePrice: 1850 },
      { name: "Shampoo Brillo Total Frasco", brand: "Ballerina", salePrice: 2150 },
      { name: "Shampoo Glycolic Gloss", brand: "Elvive", salePrice: 4000 },
      { name: "Shampoo Dream Liso", brand: "Elvive", salePrice: 6150 },
      { name: "Shampoo Hidra Hialuronico", brand: "Elvive", salePrice: 5290 },
      { name: "Shampoo Fructis Hair Food Cacao", brand: "Garnier", salePrice: 3000 },
      { name: "Shampoo Fructis Hair Food Sandia", brand: "Garnier", salePrice: 3000 },
      { name: "Shampoo Hidratacion Extrema", brand: "Pantene", salePrice: 9490 },
      { name: "Shampoo Keratina", brand: "Revlon", salePrice: 8490 },
      { name: "Shampoo Hidratacion Hialuronico", brand: "Dove", salePrice: 6150 },
      { name: "Shampoo Keratina Antifrizz", brand: "Tresemme", salePrice: 3250 },
      { name: "Acondicionador Coco Avena 400 ml", brand: "Babylee", salePrice: 2750 },
      { name: "Jabon Barra Humectacion 3 Un", brand: "Dove", salePrice: 3290 },
      { name: "Jabon Barra Antibacterial 3 Un", brand: "Protex", salePrice: 2990 },
      { name: "Jabon Liquido Doypack 700 ml", brand: "Ballerina", salePrice: 1990 },
      { name: "Pasta Dental Triple Accion 90 g", brand: "Colgate", salePrice: 1290 },
      { name: "Pasta Dental Total 12 90 g", brand: "Colgate", salePrice: 2990 },
      { name: "Cepillo Dental Medio 2 Un", brand: "Oral-B", salePrice: 2490 },
      { name: "Enjuague Bucal Menta 500 ml", brand: "Listerine", salePrice: 3990 },
      { name: "Desodorante Aerosol Men 150 ml", brand: "Dove", salePrice: 3490 },
      { name: "Desodorante Aerosol Mujer 150 ml", brand: "Rexona", salePrice: 3490 },
      { name: "Papel Higienico Humedo 42 Un", brand: "Elite", salePrice: 1590 },
      { name: "Toallas Higienicas Normal 16 Un", brand: "Nosotras", salePrice: 1990 },
      { name: "Protectores Diarios 60 Un", brand: "Kotex", salePrice: 2490 },
      { name: "Panales Talla G 30 Un", brand: "Babysec", salePrice: 8990 }
    ]
  },
  {
    category: "Mascotas",
    items: [
      { name: "Alimento Perro Adulto Carne 15 kg", brand: "Master Dog", salePrice: 24990 },
      { name: "Alimento Perro Adulto 3 kg", brand: "Master Dog", salePrice: 7990 },
      { name: "Alimento Cachorro 3 kg", brand: "Cachupin", salePrice: 5990 },
      { name: "Alimento Gato Adulto 3 kg", brand: "Master Cat", salePrice: 8990 },
      { name: "Alimento Gato Salmon 1 kg", brand: "Whiskas", salePrice: 3990 },
      { name: "Alimento Gato Carne 1 kg", brand: "Whiskas", salePrice: 3990 },
      { name: "Arena Sanitaria 4 kg", brand: "Lider", salePrice: 3990 },
      { name: "Snack Perro Dentastix 7 Un", brand: "Pedigree", salePrice: 2990 },
      { name: "Sobre Gato Salmon 85 g", brand: "Felix", salePrice: 790 },
      { name: "Sobre Perro Carne 100 g", brand: "Pedigree", salePrice: 790 }
    ]
  },
  {
    category: "Botilleria",
    items: [
      { name: "Cerveza Lager Lata 470 ml", brand: "Cristal", salePrice: 990 },
      { name: "Cerveza Lager Pack 6 Latas 470 ml", brand: "Cristal", salePrice: 5790 },
      { name: "Cerveza Escudo Lata 470 ml", brand: "Escudo", salePrice: 990 },
      { name: "Cerveza Royal Guard Lata 470 ml", brand: "Royal Guard", salePrice: 1190 },
      { name: "Cerveza Kunstmann Torobayo Botella 330 ml", brand: "Kunstmann", salePrice: 1590 },
      { name: "Vino Cabernet Sauvignon 750 ml", brand: "Gato", salePrice: 3490 },
      { name: "Vino Carmenere 750 ml", brand: "Casillero del Diablo", salePrice: 5990 },
      { name: "Vino Sauvignon Blanc 750 ml", brand: "Santa Helena", salePrice: 3990 },
      { name: "Espumante Brut 750 ml", brand: "Valdivieso", salePrice: 6990 },
      { name: "Pisco Especial 35 grados 750 ml", brand: "Alto del Carmen", salePrice: 7990 },
      { name: "Ron Anejo 750 ml", brand: "Mitjans", salePrice: 6990 },
      { name: "Cocktail Pina Colada 700 ml", brand: "Campanario", salePrice: 4990 }
    ]
  },
  {
    category: "Frutas y verduras",
    items: [
      { name: "Platano Granel 1 kg", brand: "Lider", salePrice: 1590 },
      { name: "Manzana Roja Granel 1 kg", brand: "Lider", salePrice: 1790 },
      { name: "Manzana Verde Granel 1 kg", brand: "Lider", salePrice: 1890 },
      { name: "Naranja Granel 1 kg", brand: "Lider", salePrice: 1490 },
      { name: "Limones Malla 1 kg", brand: "Lider", salePrice: 1990 },
      { name: "Papa Malla 2 kg", brand: "Lider", salePrice: 2490 },
      { name: "Cebolla Malla 1 kg", brand: "Lider", salePrice: 1490 },
      { name: "Tomate Granel 1 kg", brand: "Lider", salePrice: 1990 },
      { name: "Palta Hass Malla 700 g", brand: "Lider", salePrice: 3990 },
      { name: "Lechuga Escarola Unidad", brand: "Lider", salePrice: 1290 },
      { name: "Zanahoria Bolsa 1 kg", brand: "Lider", salePrice: 1190 },
      { name: "Pimenton Rojo Unidad", brand: "Lider", salePrice: 790 }
    ]
  }
];

export function buildDemoUsers(tenantId: string): User[] {
  return demoUsers.map((user) => ({
    ...user,
    tenantId,
    active: true
  }));
}

export function buildDemoProducts(tenantId: string): Product[] {
  const seeds = productGroups.flatMap((group) =>
    group.items.map((item) => ({
      ...item,
      category: group.category
    }))
  );

  return seeds.map((seed, index) => {
    const minimumStock = seed.minimumStock ?? 4 + (index % 7);
    const stock = seed.stock ?? (index % 19 === 0 ? Math.max(0, minimumStock - 1) : minimumStock + 5 + ((index * 7) % 36));
    const salePrice = roundToTen(seed.salePrice);

    return {
      id: seed.id ?? `prod-demo-${String(index + 1).padStart(3, "0")}`,
      tenantId,
      name: `${seed.brand ? `${seed.brand} ` : ""}${seed.name}`,
      brand: seed.brand,
      category: seed.category,
      barcode: seed.barcode ?? buildDemoBarcode(index + 1),
      costPrice: seed.costPrice ?? roundToTen(salePrice * 0.72),
      salePrice,
      stock,
      minimumStock,
      active: true
    };
  });
}

function roundToTen(value: number) {
  return Math.max(10, Math.round(value / 10) * 10);
}

function buildDemoBarcode(index: number) {
  const body = `780${String(index).padStart(9, "0")}`;
  return `${body}${calculateEan13CheckDigit(body)}`;
}

function calculateEan13CheckDigit(body: string) {
  const total = body
    .split("")
    .map((digit) => Number(digit))
    .reduce((sum, digit, index) => sum + digit * (index % 2 === 0 ? 1 : 3), 0);
  return String((10 - (total % 10)) % 10);
}
