import type { ArticleMeta, ArticleContent } from '../../shared/types';

const categories = ['科技', '财经', '体育', '娱乐', '健康', '教育', '国际', '国内'];
const authors = ['张明', '李华', '王芳', '刘洋', '陈静', '杨帆', '赵磊', '周婷'];

const articleTemplates = [
  { title: '人工智能突破：{topic}技术迎来新里程碑', keywords: ['AI', '人工智能', '技术', '创新'] },
  { title: '深度解析：{topic}行业的未来发展趋势', keywords: ['趋势', '分析', '行业', '未来'] },
  { title: '独家报道：{topic}背后的故事', keywords: ['独家', '报道', '深度', '内幕'] },
  { title: '{topic}：改变世界的十大创新', keywords: ['创新', '改变', '世界', '技术'] },
  { title: '专家观点：{topic}将如何影响我们的生活', keywords: ['专家', '影响', '生活', '观点'] },
  { title: '最新研究：{topic}领域取得重大进展', keywords: ['研究', '进展', '科学', '最新'] },
  { title: '{topic}市场分析：机遇与挑战并存', keywords: ['市场', '分析', '机遇', '挑战'] },
  { title: '人物专访：{topic}领域的领军者', keywords: ['人物', '专访', '领军', '故事'] },
];

const topics = [
  '量子计算', '区块链', '元宇宙', '新能源', '芯片技术', '生物科技',
  '自动驾驶', '太空探索', '5G通信', '虚拟现实', '人工智能伦理', '大数据',
  '云计算', '网络安全', '机器人技术', '智慧城市', '医疗AI', '绿色能源',
  '电动汽车', '智能城市', '数字经济', '隐私保护', '基因编辑', '脑机接口'
];

const generateId = () => Math.random().toString(36).substring(2, 10);

const generateSummary = (title: string): string => {
  const summaries = [
    `${title}。本文将深入探讨这一话题的方方面面，为读者带来全面的分析和独到的见解。`,
    `随着技术的不断进步，${title.toLowerCase()}正在成为业界关注的焦点。让我们一起来看看最新的发展动态。`,
    `在这个快速变化的时代，${title.toLowerCase()}不仅是技术问题，更是关乎未来发展的重要议题。`,
  ];
  return summaries[Math.floor(Math.random() * summaries.length)];
};

const generateContent = (title: string, keywords: string[]): string => {
  const paragraphs = [
    `# ${title}\n\n`,
    `## 引言\n\n在当今快速发展的科技时代，${keywords.slice(0, 2).join('和')}已经成为不可忽视的重要力量。本文将从多个角度深入探讨这一话题。\n\n`,
    `## 背景介绍\n\n近年来，随着技术的不断进步，相关领域取得了显著的发展。从基础研究到应用落地，每一个环节都凝聚着无数科研人员的心血。${keywords[0]}作为核心驱动力，正在重塑我们的生活方式。\n\n`,
    `## 技术深度解析\n\n从技术层面来看，这一领域涉及多个学科的交叉融合。算法的优化、硬件的升级、数据的积累，三者共同推动了技术的突破。专业人士指出，未来三年将是关键的发展窗口期。\n\n`,
    `## 实际应用场景\n\n在实际应用中，我们已经可以看到许多成功案例。从智能制造到智慧医疗，从金融科技到教育培训，技术的渗透正在方方面面改变着我们的生活。\n\n`,
    `## 未来展望\n\n展望未来，这一领域仍有巨大的发展空间。随着研究的深入和应用的拓展，我们有理由相信，更多令人振奋的突破即将到来。\n\n`,
    `## 结语\n\n总的来说，${keywords.join('、')}代表着未来的发展方向。让我们共同期待这一领域能够带来更多惊喜，为人类社会的进步做出更大贡献。\n`,
  ];
  return paragraphs.join('');
};

export const generateArticles = (count: number): { meta: ArticleMeta; content: ArticleContent }[] => {
  const articles: { meta: ArticleMeta; content: ArticleContent }[] = [];
  
  for (let i = 0; i < count; i++) {
    const template = articleTemplates[Math.floor(Math.random() * articleTemplates.length)];
    const topic = topics[Math.floor(Math.random() * topics.length)];
    const title = template.title.replace('{topic}', topic);
    const id = generateId();
    const keywords = [...template.keywords, topic, ...topics.slice(0, 2).filter(() => Math.random() > 0.5)];
    const uniqueKeywords = [...new Set(keywords)];
    
    const meta: ArticleMeta = {
      id,
      title,
      summary: generateSummary(title),
      cover: `https://picsum.photos/seed/${id}/800/450`,
      author: authors[Math.floor(Math.random() * authors.length)],
      publishTime: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      category: categories[Math.floor(Math.random() * categories.length)],
      tags: uniqueKeywords.slice(0, 3),
      readCount: Math.floor(Math.random() * 10000) + 100,
      keywords: uniqueKeywords,
    };
    
    const content: ArticleContent = {
      id,
      content: generateContent(title, uniqueKeywords),
      keywords: uniqueKeywords,
    };
    
    articles.push({ meta, content });
  }
  
  return articles;
};
