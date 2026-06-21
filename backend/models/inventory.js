const warehouses = [
  { id: 'WH001', name: '上海仓', city: '上海', capacity: 10000 },
  { id: 'WH002', name: '深圳仓', city: '深圳', capacity: 8000 },
  { id: 'WH003', name: '北京仓', city: '北京', capacity: 9000 },
  { id: 'WH004', name: '广州仓', city: '广州', capacity: 7000 }
];

const inventory = {
  P001: [
    { warehouseId: 'WH001', warehouseName: '上海仓', stock: 150, available: true },
    { warehouseId: 'WH002', warehouseName: '深圳仓', stock: 80, available: true },
    { warehouseId: 'WH003', warehouseName: '北京仓', stock: 0, available: false }
  ],
  P002: [
    { warehouseId: 'WH002', warehouseName: '深圳仓', stock: 80, available: true },
    { warehouseId: 'WH001', warehouseName: '上海仓', stock: 45, available: true }
  ],
  P003: [
    { warehouseId: 'WH003', warehouseName: '北京仓', stock: 300, available: true },
    { warehouseId: 'WH004', warehouseName: '广州仓', stock: 150, available: true }
  ],
  P004: [
    { warehouseId: 'WH004', warehouseName: '广州仓', stock: 120, available: true },
    { warehouseId: 'WH001', warehouseName: '上海仓', stock: 60, available: true }
  ],
  P005: [
    { warehouseId: 'WH001', warehouseName: '上海仓', stock: 200, available: true },
    { warehouseId: 'WH003', warehouseName: '北京仓', stock: 100, available: true }
  ],
  P006: [
    { warehouseId: 'WH002', warehouseName: '深圳仓', stock: 500, available: true },
    { warehouseId: 'WH004', warehouseName: '广州仓', stock: 300, available: true }
  ],
  P007: [
    { warehouseId: 'WH003', warehouseName: '北京仓', stock: 60, available: true },
    { warehouseId: 'WH002', warehouseName: '深圳仓', stock: 30, available: true }
  ],
  P008: [
    { warehouseId: 'WH004', warehouseName: '广州仓', stock: 90, available: true },
    { warehouseId: 'WH001', warehouseName: '上海仓', stock: 50, available: true }
  ]
};

module.exports = { warehouses, inventory };
