import { 
  Tenant, 
  User, 
  Category, 
  Product, 
  FloorSection, 
  DiningTable, 
  Order, 
  KotTicket, 
  TillSession 
} from '../types';

export const SEED_TENANT: Tenant = {
  id: 'tenant-simba-01',
  name: 'Simba Hospitality & Retail Group',
  slug: 'simba-group',
  kraPin: 'P051982736Z',
  currency: 'KES',
  country: 'Kenya',
  branches: [
    {
      id: 'branch-kilimani',
      tenantId: 'tenant-simba-01',
      name: 'Kilimani Flagship Bistro & Lounge',
      code: 'KLM-01',
      phone: '+254 712 345 678',
      address: 'Argwings Kodhek Rd, Nairobi',
      etimsDeviceId: 'VSCU-KEN-889021',
    },
    {
      id: 'branch-westlands',
      tenantId: 'tenant-simba-01',
      name: 'Westlands Sports Bar & Grill',
      code: 'WST-02',
      phone: '+254 722 987 654',
      address: 'Mpaka Road, Westlands, Nairobi',
      etimsDeviceId: 'VSCU-KEN-889022',
    }
  ]
};

export const SEED_USERS: User[] = [
  {
    id: 'usr-faith',
    name: 'Faith Mwende',
    phone: '+254 711 223 344',
    email: 'faith@simbagroup.co.ke',
    role: 'WAITER',
    pin: '1234',
    assignedBranchId: 'branch-kilimani',
    avatar: 'FM'
  },
  {
    id: 'usr-brian',
    name: 'Brian Otieno',
    phone: '+254 722 334 455',
    email: 'brian@simbagroup.co.ke',
    role: 'CASHIER',
    pin: '2233',
    assignedBranchId: 'branch-kilimani',
    avatar: 'BO'
  },
  {
    id: 'usr-kevin',
    name: 'Kevin Kiprop',
    phone: '+254 733 445 566',
    email: 'kevin@simbagroup.co.ke',
    role: 'BARTENDER',
    pin: '3344',
    assignedBranchId: 'branch-kilimani',
    avatar: 'KK'
  },
  {
    id: 'usr-juma',
    name: 'Chef Juma Hassan',
    phone: '+254 744 556 677',
    email: 'juma@simbagroup.co.ke',
    role: 'CHEF',
    pin: '4455',
    assignedBranchId: 'branch-kilimani',
    avatar: 'JH'
  },
  {
    id: 'usr-sarah',
    name: 'Sarah Wanjiku',
    phone: '+254 755 667 788',
    email: 'sarah@simbagroup.co.ke',
    role: 'MANAGER',
    pin: '5566',
    assignedBranchId: 'branch-kilimani',
    avatar: 'SW'
  },
  {
    id: 'usr-david',
    name: 'David Omondi',
    phone: '+254 700 112 233',
    email: 'david@simbagroup.co.ke',
    role: 'OWNER',
    pin: '9999',
    assignedBranchId: 'branch-kilimani',
    avatar: 'DO'
  }
];

export const SEED_CATEGORIES: Category[] = [
  { id: 'cat-starters', name: 'Starters & Bites', department: 'FOOD', iconName: 'UtensilsCrossed', color: '#f97316' },
  { id: 'cat-choma', name: 'Nyama Choma & Grills', department: 'GRILL', iconName: 'Flame', color: '#dc2626' },
  { id: 'cat-sides', name: 'Traditional Sides', department: 'FOOD', iconName: 'Soup', color: '#16a34a' },
  { id: 'cat-mains', name: 'Mains & Seafood', department: 'FOOD', iconName: 'Fish', color: '#2563eb' },
  { id: 'cat-beers', name: 'Beers & Ciders', department: 'BAR', iconName: 'Beer', color: '#d97706' },
  { id: 'cat-cocktails', name: 'Cocktails & Spirits', department: 'BAR', iconName: 'Wine', color: '#7c3aed' },
  { id: 'cat-softs', name: 'Non-Alcoholic & Juices', department: 'BAR', iconName: 'Coffee', color: '#059669' },
  { id: 'cat-retail', name: 'Supermarket & Retail', department: 'RETAIL', iconName: 'ScanBarcode', color: '#4f46e5' },
];

export const SEED_PRODUCTS: Product[] = [
  // Nyama Choma / Grills
  {
    id: 'prod-mbuzi-1kg',
    categoryId: 'cat-choma',
    name: 'Mbuzi Choma (1 Kg)',
    department: 'GRILL',
    sku: 'GRL-MBZ-1KG',
    barcode: '616110001001',
    costPriceKes: 800,
    sellingPriceKes: 1600,
    taxRatePercent: 16,
    isAvailable: true,
    description: 'Slow-roasted Kenyan goat ribs served with kachumbari'
  },
  {
    id: 'prod-mbuzi-half',
    categoryId: 'cat-choma',
    name: 'Mbuzi Choma (1/2 Kg)',
    department: 'GRILL',
    sku: 'GRL-MBZ-500G',
    barcode: '616110001002',
    costPriceKes: 420,
    sellingPriceKes: 850,
    taxRatePercent: 16,
    isAvailable: true,
    description: 'Tender goat roast half portion with kachumbari'
  },
  {
    id: 'prod-kuku-choma',
    categoryId: 'cat-choma',
    name: 'Kuku Choma (Full)',
    department: 'GRILL',
    sku: 'GRL-KUKU-FUL',
    barcode: '616110001003',
    costPriceKes: 750,
    sellingPriceKes: 1500,
    taxRatePercent: 16,
    isAvailable: true,
    description: 'Marinated char-grilled free range chicken'
  },
  {
    id: 'prod-pork-ribs',
    categoryId: 'cat-choma',
    name: 'Glazed BBQ Pork Ribs 600g',
    department: 'GRILL',
    sku: 'GRL-PRK-600G',
    barcode: '616110001004',
    costPriceKes: 650,
    sellingPriceKes: 1350,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Starters & Bites
  {
    id: 'prod-samosa-beef',
    categoryId: 'cat-starters',
    name: 'Spiced Beef Samosas (3 pcs)',
    department: 'FOOD',
    sku: 'STR-SMS-BEEF',
    barcode: '616110002001',
    costPriceKes: 100,
    sellingPriceKes: 300,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-sausage-pair',
    categoryId: 'cat-starters',
    name: 'Farmers Choice Sausages (Pair)',
    department: 'FOOD',
    sku: 'STR-SAUS-PR',
    barcode: '616110002002',
    costPriceKes: 90,
    sellingPriceKes: 250,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-chicken-wings',
    categoryId: 'cat-starters',
    name: 'Sticky Sweet Chili Wings (6 pcs)',
    department: 'FOOD',
    sku: 'STR-WNGS-CHL',
    barcode: '616110002003',
    costPriceKes: 280,
    sellingPriceKes: 650,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Traditional Sides
  {
    id: 'prod-ugali',
    categoryId: 'cat-sides',
    name: 'Ugali Afya (Brown / White)',
    department: 'FOOD',
    sku: 'SDE-UGL-001',
    barcode: '616110003001',
    costPriceKes: 30,
    sellingPriceKes: 120,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-sukuma-spinach',
    categoryId: 'cat-sides',
    name: 'Sukuma Wiki & Spinach Mix',
    department: 'FOOD',
    sku: 'SDE-SKM-001',
    barcode: '616110003002',
    costPriceKes: 40,
    sellingPriceKes: 150,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-chips-masala',
    categoryId: 'cat-sides',
    name: 'Chips Masala',
    department: 'FOOD',
    sku: 'SDE-CHP-MSL',
    barcode: '616110003003',
    costPriceKes: 80,
    sellingPriceKes: 280,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-mukimo',
    categoryId: 'cat-sides',
    name: 'Traditional Mukimo Portion',
    department: 'FOOD',
    sku: 'SDE-MKM-001',
    barcode: '616110003004',
    costPriceKes: 70,
    sellingPriceKes: 220,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Mains & Fish
  {
    id: 'prod-tilapia-whole',
    categoryId: 'cat-mains',
    name: 'Whole Lake Victoria Tilapia (Wet Fry)',
    department: 'FOOD',
    sku: 'MAN-TLP-WET',
    barcode: '616110004001',
    costPriceKes: 450,
    sellingPriceKes: 950,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-beef-fry',
    categoryId: 'cat-mains',
    name: 'Wet Fry Beef Karanga',
    department: 'FOOD',
    sku: 'MAN-BF-KRG',
    barcode: '616110004002',
    costPriceKes: 350,
    sellingPriceKes: 750,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Beers & Ciders
  {
    id: 'prod-tusker-lager',
    categoryId: 'cat-beers',
    name: 'Tusker Lager 500ml',
    department: 'BAR',
    sku: 'BAR-TSK-LGR',
    barcode: '616110005001',
    costPriceKes: 180,
    sellingPriceKes: 350,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-tusker-malt',
    categoryId: 'cat-beers',
    name: 'Tusker Malt 330ml',
    department: 'BAR',
    sku: 'BAR-TSK-MLT',
    barcode: '616110005002',
    costPriceKes: 190,
    sellingPriceKes: 370,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-white-cap',
    categoryId: 'cat-beers',
    name: 'White Cap Crisp 500ml',
    department: 'BAR',
    sku: 'BAR-WHT-CAP',
    barcode: '616110005003',
    costPriceKes: 185,
    sellingPriceKes: 360,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-savanna-dry',
    categoryId: 'cat-beers',
    name: 'Savanna Dry Cider 330ml',
    department: 'BAR',
    sku: 'BAR-SVN-DRY',
    barcode: '616110005004',
    costPriceKes: 220,
    sellingPriceKes: 420,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Cocktails & Spirits
  {
    id: 'prod-dawa-cocktail',
    categoryId: 'cat-cocktails',
    name: 'Original Kenyan Dawa Cocktail',
    department: 'BAR',
    sku: 'BAR-CKT-DWA',
    barcode: '616110006001',
    costPriceKes: 220,
    sellingPriceKes: 650,
    taxRatePercent: 16,
    isAvailable: true,
    description: 'Vodka, fresh lime chunks, raw organic honey, crushed ice'
  },
  {
    id: 'prod-whisky-peg',
    categoryId: 'cat-cocktails',
    name: 'Johnnie Walker Black (Double Peg 50ml)',
    department: 'BAR',
    sku: 'BAR-JWB-50ML',
    barcode: '616110006002',
    costPriceKes: 280,
    sellingPriceKes: 600,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-gin-tonic',
    categoryId: 'cat-cocktails',
    name: 'Hendricks Gin & Tonic',
    department: 'BAR',
    sku: 'BAR-HND-GNT',
    barcode: '616110006003',
    costPriceKes: 300,
    sellingPriceKes: 750,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Soft Drinks & Juices
  {
    id: 'prod-passion-juice',
    categoryId: 'cat-softs',
    name: 'Fresh Passion Fruit Juice 500ml',
    department: 'BAR',
    sku: 'SFT-PSN-500M',
    barcode: '616110007001',
    costPriceKes: 90,
    sellingPriceKes: 280,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-stoney-soda',
    categoryId: 'cat-softs',
    name: 'Stoney Tangawizi 300ml Glass',
    department: 'BAR',
    sku: 'SFT-STN-300M',
    barcode: '616110007002',
    costPriceKes: 45,
    sellingPriceKes: 150,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-mineral-water',
    categoryId: 'cat-softs',
    name: 'Still Mineral Water 500ml',
    department: 'BAR',
    sku: 'SFT-WTR-500M',
    barcode: '616110007003',
    costPriceKes: 30,
    sellingPriceKes: 100,
    taxRatePercent: 16,
    isAvailable: true
  },

  // Retail & Supermarket items
  {
    id: 'prod-milk-brooks',
    categoryId: 'cat-retail',
    name: 'Brookside Whole Milk 500ml',
    department: 'RETAIL',
    sku: 'RTL-BRK-500M',
    barcode: '616110100101',
    costPriceKes: 52,
    sellingPriceKes: 65,
    taxRatePercent: 0, // Zero-rated basic food
    isAvailable: true
  },
  {
    id: 'prod-unga-jogoo',
    categoryId: 'cat-retail',
    name: 'Jogoo Maize Flour 2kg',
    department: 'RETAIL',
    sku: 'RTL-JOG-2KG',
    barcode: '616110100102',
    costPriceKes: 145,
    sellingPriceKes: 180,
    taxRatePercent: 0,
    isAvailable: true
  },
  {
    id: 'prod-oil-elianto',
    categoryId: 'cat-retail',
    name: 'Elianto Corn Oil 1 Litre',
    department: 'RETAIL',
    sku: 'RTL-ELT-1L',
    barcode: '616110100103',
    costPriceKes: 310,
    sellingPriceKes: 380,
    taxRatePercent: 16,
    isAvailable: true
  },
  {
    id: 'prod-sugar-mumias',
    categoryId: 'cat-retail',
    name: 'White Refined Sugar 1kg',
    department: 'RETAIL',
    sku: 'RTL-SGR-1KG',
    barcode: '616110100104',
    costPriceKes: 140,
    sellingPriceKes: 175,
    taxRatePercent: 16,
    isAvailable: true
  }
];

export const SEED_SECTIONS: FloorSection[] = [
  { id: 'sec-terrace', branchId: 'branch-kilimani', name: 'Garden Terrace', displayOrder: 1 },
  { id: 'sec-main', branchId: 'branch-kilimani', name: 'Main Dining Floor', displayOrder: 2 },
  { id: 'sec-bar', branchId: 'branch-kilimani', name: 'Sports Bar & Lounge', displayOrder: 3 },
  { id: 'sec-vip', branchId: 'branch-kilimani', name: 'VIP Lounge', displayOrder: 4 },
];

export const SEED_TABLES: DiningTable[] = [
  // Garden Terrace
  { id: 'tbl-01', sectionId: 'sec-terrace', tableNumber: 'T-01', capacity: 4, status: 'OCCUPIED', currentOrderId: 'ord-active-01', waiterName: 'Faith Mwende', guestCount: 3, activeOrderTotal: 3850, occupiedSince: '45 mins ago' },
  { id: 'tbl-02', sectionId: 'sec-terrace', tableNumber: 'T-02', capacity: 2, status: 'VACANT' },
  { id: 'tbl-03', sectionId: 'sec-terrace', tableNumber: 'T-03', capacity: 6, status: 'BILLED', currentOrderId: 'ord-active-02', waiterName: 'Faith Mwende', guestCount: 5, activeOrderTotal: 8400, occupiedSince: '1h 15m ago' },
  { id: 'tbl-04', sectionId: 'sec-terrace', tableNumber: 'T-04', capacity: 4, status: 'VACANT' },

  // Main Dining Floor
  { id: 'tbl-05', sectionId: 'sec-main', tableNumber: 'M-05', capacity: 4, status: 'OCCUPIED', currentOrderId: 'ord-active-03', waiterName: 'Faith Mwende', guestCount: 4, activeOrderTotal: 5200, occupiedSince: '20 mins ago' },
  { id: 'tbl-06', sectionId: 'sec-main', tableNumber: 'M-06', capacity: 6, status: 'VACANT' },
  { id: 'tbl-07', sectionId: 'sec-main', tableNumber: 'M-07', capacity: 8, status: 'RESERVED', guestCount: 8 },
  { id: 'tbl-08', sectionId: 'sec-main', tableNumber: 'M-08', capacity: 4, status: 'VACANT' },

  // Sports Bar & Lounge
  { id: 'tbl-b1', sectionId: 'sec-bar', tableNumber: 'Bar-01', capacity: 2, status: 'OCCUPIED', currentOrderId: 'ord-active-04', waiterName: 'Kevin Kiprop', guestCount: 2, activeOrderTotal: 1750, occupiedSince: '30 mins ago' },
  { id: 'tbl-b2', sectionId: 'sec-bar', tableNumber: 'Bar-02', capacity: 2, status: 'VACANT' },
  { id: 'tbl-b3', sectionId: 'sec-bar', tableNumber: 'Bar-03', capacity: 4, status: 'VACANT' },

  // VIP
  { id: 'tbl-v1', sectionId: 'sec-vip', tableNumber: 'VIP-01', capacity: 10, status: 'VACANT' }
];

export const SEED_INITIAL_ORDERS: Record<string, Order> = {
  'ord-active-01': {
    id: 'ord-active-01',
    tenantId: 'tenant-simba-01',
    branchId: 'branch-kilimani',
    tableId: 'tbl-01',
    tableNumber: 'T-01',
    waiterId: 'usr-faith',
    waiterName: 'Faith Mwende',
    orderType: 'DINE_IN',
    guestCount: 3,
    items: [
      { id: 'item-101', productId: 'prod-mbuzi-1kg', productName: 'Mbuzi Choma (1 Kg)', department: 'GRILL', unitPrice: 1600, quantity: 1, notes: 'Medium rare, extra kachumbari', kotStatus: 'SENT_TO_KITCHEN', seatNumber: 1 },
      { id: 'item-102', productId: 'prod-ugali', productName: 'Ugali Afya (Brown / White)', department: 'FOOD', unitPrice: 120, quantity: 2, notes: 'Hot', kotStatus: 'SENT_TO_KITCHEN', seatNumber: 2 },
      { id: 'item-103', productId: 'prod-tusker-lager', productName: 'Tusker Lager 500ml', department: 'BAR', unitPrice: 350, quantity: 4, notes: 'Cold from fridge', kotStatus: 'SENT_TO_KITCHEN', seatNumber: 3 },
      { id: 'item-104', productId: 'prod-dawa-cocktail', productName: 'Original Kenyan Dawa Cocktail', department: 'BAR', unitPrice: 650, quantity: 1, notes: 'Extra honey', kotStatus: 'SENT_TO_KITCHEN', seatNumber: 1 }
    ],
    subtotal: 3318.97,
    taxTotal: 531.03,
    discountTotal: 0,
    grandTotal: 3850,
    status: 'OPEN',
    createdAt: '2026-09-19T14:30:00Z'
  },
  'ord-active-02': {
    id: 'ord-active-02',
    tenantId: 'tenant-simba-01',
    branchId: 'branch-kilimani',
    tableId: 'tbl-03',
    tableNumber: 'T-03',
    waiterId: 'usr-faith',
    waiterName: 'Faith Mwende',
    orderType: 'DINE_IN',
    guestCount: 5,
    items: [
      { id: 'item-201', productId: 'prod-mbuzi-1kg', productName: 'Mbuzi Choma (1 Kg)', department: 'GRILL', unitPrice: 1600, quantity: 2, kotStatus: 'SERVED', seatNumber: 1 },
      { id: 'item-202', productId: 'prod-kuku-choma', productName: 'Kuku Choma (Full)', department: 'GRILL', unitPrice: 1500, quantity: 1, kotStatus: 'SERVED', seatNumber: 2 },
      { id: 'item-203', productId: 'prod-chips-masala', productName: 'Chips Masala', department: 'FOOD', unitPrice: 280, quantity: 3, kotStatus: 'SERVED', seatNumber: 3 },
      { id: 'item-204', productId: 'prod-tusker-lager', productName: 'Tusker Lager 500ml', department: 'BAR', unitPrice: 350, quantity: 8, kotStatus: 'SERVED', seatNumber: 4 }
    ],
    subtotal: 7241.38,
    taxTotal: 1158.62,
    discountTotal: 0,
    grandTotal: 8400,
    status: 'BILLED',
    createdAt: '2026-09-19T13:45:00Z'
  }
};

export const SEED_INITIAL_KOTS: KotTicket[] = [
  {
    id: 'kot-001',
    ticketNumber: 1042,
    orderId: 'ord-active-01',
    tableNumber: 'T-01',
    waiterName: 'Faith Mwende',
    station: 'GRILL',
    status: 'PREPARING',
    createdAt: '18 mins ago',
    items: [
      { id: 'ki-1', orderItemId: 'item-101', productName: 'Mbuzi Choma (1 Kg)', quantity: 1, notes: 'Medium rare, extra kachumbari', seatNumber: 1 }
    ]
  },
  {
    id: 'kot-002',
    ticketNumber: 1043,
    orderId: 'ord-active-01',
    tableNumber: 'T-01',
    waiterName: 'Faith Mwende',
    station: 'FOOD',
    status: 'READY',
    createdAt: '16 mins ago',
    items: [
      { id: 'ki-2', orderItemId: 'item-102', productName: 'Ugali Afya (Brown / White)', quantity: 2, notes: 'Hot', seatNumber: 2 }
    ]
  },
  {
    id: 'kot-003',
    ticketNumber: 1044,
    orderId: 'ord-active-01',
    tableNumber: 'T-01',
    waiterName: 'Faith Mwende',
    station: 'BAR',
    status: 'SERVED',
    createdAt: '15 mins ago',
    items: [
      { id: 'ki-3', orderItemId: 'item-103', productName: 'Tusker Lager 500ml', quantity: 4, notes: 'Cold from fridge', seatNumber: 3 },
      { id: 'ki-4', orderItemId: 'item-104', productName: 'Original Kenyan Dawa Cocktail', quantity: 1, notes: 'Extra honey', seatNumber: 1 }
    ]
  }
];

export const SEED_TILL_SESSION: TillSession = {
  id: 'till-session-klm-01',
  cashierId: 'usr-brian',
  cashierName: 'Brian Otieno',
  branchId: 'branch-kilimani',
  openingFloat: 5000,
  openedAt: 'Today, 08:00 AM',
  expectedCash: 16500,
  totalMpesa: 32400,
  totalCard: 14800,
  totalSales: 58700,
  status: 'OPEN'
};
