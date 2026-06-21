const products = [
  {
    id: 'P001',
    name: 'iPhone 15 Pro',
    category: '手机数码',
    price: 7999,
    originalPrice: 8999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPhone%2015%20Pro%20smartphone%20product%20photo&image_size=square',
    description: '全新A17 Pro芯片，钛金属边框，专业级摄像系统',
    stock: 150,
    warehouse: '上海仓',
    specs: ['256GB', '512GB', '1TB'],
    tags: ['新品', '热销']
  },
  {
    id: 'P002',
    name: 'MacBook Pro 14英寸',
    category: '电脑办公',
    price: 14999,
    originalPrice: 16999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=MacBook%20Pro%2014%20inch%20laptop%20product%20photo&image_size=square',
    description: 'M3 Pro芯片，18GB内存，512GB存储',
    stock: 80,
    warehouse: '深圳仓',
    specs: ['512GB', '1TB', '2TB'],
    tags: ['推荐']
  },
  {
    id: 'P003',
    name: 'AirPods Pro 2',
    category: '手机数码',
    price: 1799,
    originalPrice: 1999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=AirPods%20Pro%202%20wireless%20earbuds%20product%20photo&image_size=square',
    description: '主动降噪，自适应通透模式，空间音频',
    stock: 300,
    warehouse: '北京仓',
    specs: ['标准版', 'USB-C版'],
    tags: ['热销']
  },
  {
    id: 'P004',
    name: '索尼WH-1000XM5',
    category: '手机数码',
    price: 2299,
    originalPrice: 2999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Sony%20WH-1000XM5%20headphones%20product%20photo&image_size=square',
    description: '业界顶级降噪，30小时续航',
    stock: 120,
    warehouse: '广州仓',
    specs: ['黑色', '银色'],
    tags: []
  },
  {
    id: 'P005',
    name: 'iPad Air',
    category: '电脑办公',
    price: 4599,
    originalPrice: 4999,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=iPad%20Air%20tablet%20product%20photo&image_size=square',
    description: 'M2芯片，10.9英寸显示屏，支持Apple Pencil',
    stock: 200,
    warehouse: '上海仓',
    specs: ['64GB', '256GB'],
    tags: ['新品']
  },
  {
    id: 'P006',
    name: '小米手环8 Pro',
    category: '智能穿戴',
    price: 379,
    originalPrice: 499,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Xiaomi%20Band%208%20Pro%20smart%20band%20product%20photo&image_size=square',
    description: '1.74英寸AMOLED大屏，14天超长续航',
    stock: 500,
    warehouse: '深圳仓',
    specs: ['黑色', '蓝色', '粉色'],
    tags: ['超值']
  },
  {
    id: 'P007',
    name: '戴森V15',
    category: '家用电器',
    price: 4290,
    originalPrice: 4990,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Dyson%20V15%20vacuum%20cleaner%20product%20photo&image_size=square',
    description: '激光探测，可视化灰尘检测',
    stock: 60,
    warehouse: '北京仓',
    specs: ['标准版', 'Complete版'],
    tags: []
  },
  {
    id: 'P008',
    name: 'Nintendo Switch OLED',
    category: '游戏娱乐',
    price: 2199,
    originalPrice: 2599,
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Nintendo%20Switch%20OLED%20gaming%20console%20product%20photo&image_size=square',
    description: '7英寸OLED屏幕，64GB存储',
    stock: 90,
    warehouse: '广州仓',
    specs: ['白色版', 'Splatoon版'],
    tags: ['热销']
  }
];

module.exports = products;
