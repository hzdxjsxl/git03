import { Product } from '../types';
import { generateRandomVector } from '../utils/vector';
import { config } from '../config';

const productNames = [
  { name: '时尚纯棉T恤', category: '服装', subCategory: '上衣', price: [59, 199] },
  { name: '休闲牛仔裤', category: '服装', subCategory: '裤子', price: [129, 399] },
  { name: '运动鞋', category: '鞋靴', subCategory: '运动', price: [199, 899] },
  { name: '商务皮鞋', category: '鞋靴', subCategory: '商务', price: [299, 1299] },
  { name: '双肩背包', category: '箱包', subCategory: '背包', price: [89, 599] },
  { name: '单肩挎包', category: '箱包', subCategory: '挎包', price: [129, 899] },
  { name: '智能手机', category: '数码', subCategory: '手机', price: [1999, 8999] },
  { name: '无线耳机', category: '数码', subCategory: '耳机', price: [99, 1999] },
  { name: '智能手表', category: '数码', subCategory: '手表', price: [299, 3999] },
  { name: '笔记本电脑', category: '数码', subCategory: '电脑', price: [3999, 15999] },
  { name: '机械键盘', category: '数码', subCategory: '外设', price: [199, 1599] },
  { name: '游戏鼠标', category: '数码', subCategory: '外设', price: [89, 899] },
  { name: '保温杯', category: '家居', subCategory: '厨具', price: [49, 399] },
  { name: '床上四件套', category: '家居', subCategory: '家纺', price: [199, 999] },
  { name: '空气净化器', category: '家居', subCategory: '电器', price: [599, 3999] },
  { name: '扫地机器人', category: '家居', subCategory: '电器', price: [999, 5999] },
  { name: '护肤套装', category: '美妆', subCategory: '护肤', price: [99, 1999] },
  { name: '口红礼盒', category: '美妆', subCategory: '彩妆', price: [149, 899] },
  { name: '运动套装', category: '运动', subCategory: '健身', price: [199, 1299] },
  { name: '瑜伽垫', category: '运动', subCategory: '健身', price: [49, 399] },
  { name: '跑步鞋', category: '鞋靴', subCategory: '运动', price: [299, 1499] },
  { name: '足球', category: '运动', subCategory: '球类', price: [59, 599] },
  { name: '茶叶礼盒', category: '食品', subCategory: '茶叶', price: [99, 1999] },
  { name: '进口零食大礼包', category: '食品', subCategory: '零食', price: [79, 599] },
  { name: '婴儿奶粉', category: '母婴', subCategory: '奶粉', price: [199, 699] },
  { name: '儿童玩具', category: '母婴', subCategory: '玩具', price: [49, 999] },
  { name: '男士皮带', category: '配饰', subCategory: '皮带', price: [89, 899] },
  { name: '女士项链', category: '配饰', subCategory: '首饰', price: [149, 2999] },
  { name: '太阳镜', category: '配饰', subCategory: '眼镜', price: [99, 1599] },
  { name: '汽车用品', category: '汽车', subCategory: '内饰', price: [39, 999] },
  { name: '汽车坐垫', category: '汽车', subCategory: '内饰', price: [129, 699] },
  { name: '行车记录仪', category: '汽车', subCategory: '电子', price: [199, 1299] },
  { name: '多肉植物', category: '家居', subCategory: '绿植', price: [19, 199] },
  { name: '鲜花速递', category: '家居', subCategory: '鲜花', price: [89, 599] },
  { name: '图书', category: '图书', subCategory: '文学', price: [29, 299] },
  { name: '电子书阅读器', category: '数码', subCategory: '阅读', price: [499, 2499] },
  { name: '音响音箱', category: '数码', subCategory: '音频', price: [199, 3999] },
  { name: '加湿器', category: '家居', subCategory: '电器', price: [79, 599] },
  { name: '咖啡机', category: '家居', subCategory: '电器', price: [299, 4999] },
  { name: '微波炉', category: '家居', subCategory: '电器', price: [399, 2999] },
];

const adjectives = [
  '新款', '经典', '潮流', '简约', '复古', '时尚', '高端', '轻奢',
  '智能', '便携', '多功能', '高品质', '限量版', '联名款', '设计师款',
];

const colors = [
  '黑色', '白色', '红色', '蓝色', '灰色', '粉色', '绿色', '米色',
];

const tagsPool: Record<string, string[]> = {
  '服装': ['修身', '宽松', '透气', '保暖', '百搭', '显瘦', '纯棉', '真丝', '羊毛', '羊绒'],
  '鞋靴': ['透气', '轻便', '耐磨', '减震', '防水', '真皮', '帆布', '网面'],
  '箱包': ['大容量', '防水', '真皮', '帆布', '商务', '休闲', '时尚', '轻便'],
  '数码': ['高清', '智能', '无线', '快充', '高清屏', '长续航', '轻薄', '高性能'],
  '家居': ['环保', '简约', '北欧', '日式', '智能', '节能', '静音', '高效'],
  '美妆': ['补水', '保湿', '美白', '抗皱', '控油', '防晒', '遮瑕', '持久'],
  '运动': ['速干', '透气', '弹力', '轻便', '专业', '训练', '比赛', '健身'],
  '食品': ['有机', '进口', '无糖', '低脂', '高蛋白', '天然', '新鲜', '特产'],
  '母婴': ['安全', '环保', '柔软', '透气', '益智', '早教', '安全', '舒适'],
  '配饰': ['时尚', '百搭', '经典', '轻奢', '个性', '简约', '复古', '精致'],
  '汽车': ['环保', '耐用', '智能', '高清', '夜视', '广角', '防震', '防水'],
  '图书': ['畅销', '经典', '新书', '名著', '小说', '传记', '教育', '科技'],
};

const generatePrice = (range: number[], hasDiscount: boolean) => {
  const base = Math.round(Math.random() * (range[1] - range[0]) + range[0]);
  const price = Math.round(base / 10) * 10;
  const originalPrice = hasDiscount ? Math.round(price * (1.2 + Math.random() * 0.5)) : undefined;
  return { price, originalPrice };
};

const generateTags = (category: string) => {
  const pool = tagsPool[category] || ['优质', '热销', '新品', '爆款'];
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(Math.random() * 3));
};

const generateImageUrl = (productId: string, seed: number) => {
  const widths = [300, 400, 500, 600];
  const heights = [300, 400, 500, 600, 700];
  const w = widths[Math.floor(Math.random() * widths.length)];
  const h = heights[Math.floor(Math.random() * heights.length)];
  const categories = ['fashion', 'electronics', 'home', 'sports', 'beauty', 'food', 'toys', 'books'];
  const cat = categories[seed % categories.length];
  return `https://picsum.photos/seed/${productId}/${w}/${h}`;
};

const generateName = (base: { name: string; category: string; subCategory: string; price: number[] }) => {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const color = Math.random() > 0.5 ? colors[Math.floor(Math.random() * colors.length)] : '';
  return `${adj}${color}${base.name}`;
};

export const generateProducts = (count: number, dimension: number): Product[] => {
  const products: Product[] = [];
  
  for (let i = 0; i < count; i++) {
    const base = productNames[i % productNames.length];
    const { price, originalPrice } = generatePrice(base.price, Math.random() > 0.6);
    const productId = `prod_${i.toString().padStart(6, '0')}`;
    const tags = generateTags(base.category);
    const name = generateName(base);
    const rating = Math.round((3.5 + Math.random() * 1.5) * 10) / 10;
    const reviewCount = Math.floor(Math.random() * 5000) + 10;
    const sales = Math.floor(Math.random() * 50000) + 100;

    products.push({
      id: productId,
      name,
      category: base.category,
      subCategory: base.subCategory,
      price,
      originalPrice,
      imageUrl: generateImageUrl(productId, i),
      rating,
      reviewCount,
      sales,
      tags,
      description: `${name}，精选优质材料，匠心工艺，品质保证。${tags.join('，')}。`,
      embedding: generateRandomVector(dimension),
      createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    });
  }

  return products;
};

export const mockProducts = generateProducts(200, config.vectorDimension);
