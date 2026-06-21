import type { Post, SentimentResult, PostWithSentiment, Platform } from '../../shared/types';

const PLATFORMS: Platform[] = ['weibo', 'wechat', 'douyin', 'xiaohongshu', 'bilibili'];

const HOT_KEYWORDS = [
  '发布会', '新品', '降价', '促销', '质量', '售后', '客服', '体验',
  '推荐', '吐槽', '差评', '好评', '回购', '避雷', '种草', '开箱',
  '对比', '测评', '性价比', '功能', '外观', '设计', '续航', '性能',
  '安全', '隐私', '泄露', '漏洞', '更新', '升级', '修复', 'bug',
  '道歉', '回应', '声明', '辟谣', '官方', '热搜', '话题', '讨论'
];

const CONTENT_TEMPLATES = [
  '今天{keyword}真的{adj}，{emotion}{punct}',
  '关于{keyword}，我想说{adj}{punct}',
  '{keyword}的体验{adj}，值得{action}{punct}',
  '终于等到{keyword}了！{emotion}{punct}',
  '有人和我一样觉得{keyword}{adj}吗？',
  '{keyword}太{adj}了，必须{action}{punct}',
  '客观评价一下{keyword}：{adj}{punct}',
  '{keyword}踩雷了，{adj}{punct}',
  '安利一下{keyword}，真的{adj}{punct}',
  '用了一周{keyword}，感觉{adj}{punct}'
];

const ADJECTIVES = {
  positive: ['太棒了', '超好用', '很满意', '惊艳', '靠谱', '超出预期', '香', '值得', '良心', '完美'],
  negative: ['失望', '垃圾', '坑', '差劲', '无语', '后悔', '糟糕', '劝退', '不值', '骗人'],
  neutral: ['一般', '还行', '普通', '中规中矩', '有待提高', '凑活', '马马虎虎', '还好']
};

const EMOTIONS = {
  positive: ['开心', '激动', '惊喜', '满意', '爱了'],
  negative: ['生气', '无语', '失望', '愤怒', '难过'],
  neutral: ['', '', '', '思考ing', '观望中']
};

const ACTIONS = {
  positive: ['入手', '推荐给朋友', '回购', '收藏', '点赞'],
  negative: ['避雷', '退货', '投诉', '曝光', '维权'],
  neutral: ['再看看', '观望', '考虑一下', '对比对比', '等等看']
};

const PUNCTUATIONS = ['！', '！！', '。', '～', ''];

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateSentiment(): { polarity: number; emotions: SentimentResult['emotions']; keywords: string[] } {
  const rand = Math.random();
  let polarity: number;
  let sentimentType: 'positive' | 'negative' | 'neutral';

  if (rand < 0.4) {
    sentimentType = 'positive';
    polarity = randomFloat(0.3, 1);
  } else if (rand < 0.75) {
    sentimentType = 'neutral';
    polarity = randomFloat(-0.3, 0.3);
  } else {
    sentimentType = 'negative';
    polarity = randomFloat(-1, -0.3);
  }

  const emotions: SentimentResult['emotions'] = {
    anger: sentimentType === 'negative' ? randomFloat(0.3, 0.9) : randomFloat(0, 0.2),
    joy: sentimentType === 'positive' ? randomFloat(0.4, 0.95) : randomFloat(0, 0.25),
    sadness: sentimentType === 'negative' ? randomFloat(0.2, 0.7) : randomFloat(0, 0.15),
    fear: randomFloat(0, 0.3),
    surprise: randomFloat(0.1, 0.5)
  };

  const keywordCount = randomInt(1, 4);
  const keywords: string[] = [];
  for (let i = 0; i < keywordCount; i++) {
    const kw = randomChoice(HOT_KEYWORDS);
    if (!keywords.includes(kw)) keywords.push(kw);
  }

  return { polarity, emotions, keywords };
}

function generateContent(sentimentType: 'positive' | 'negative' | 'neutral', keywords: string[]): string {
  const template = randomChoice(CONTENT_TEMPLATES);
  const keyword = keywords[0] || randomChoice(HOT_KEYWORDS);
  const adj = randomChoice(ADJECTIVES[sentimentType]);
  const emotion = randomChoice(EMOTIONS[sentimentType]);
  const action = randomChoice(ACTIONS[sentimentType]);
  const punct = randomChoice(PUNCTUATIONS);

  return template
    .replace('{keyword}', keyword)
    .replace('{adj}', adj)
    .replace('{emotion}', emotion)
    .replace('{action}', action)
    .replace('{punct}', punct);
}

export function generatePostWithSentiment(timestamp: number): PostWithSentiment {
  const sentiment = generateSentiment();
  const sentimentType = sentiment.polarity > 0.3 ? 'positive' : sentiment.polarity < -0.3 ? 'negative' : 'neutral';

  const id = `post_${timestamp}_${Math.random().toString(36).substr(2, 9)}`;
  const content = generateContent(sentimentType, sentiment.keywords);

  const post: Post = {
    id,
    content,
    timestamp,
    platform: randomChoice(PLATFORMS),
    userId: `user_${randomInt(1000, 99999)}`,
    likes: randomInt(0, 5000),
    comments: randomInt(0, 500),
    shares: randomInt(0, 200)
  };

  const sentimentResult: SentimentResult = {
    postId: id,
    polarity: sentiment.polarity,
    confidence: randomFloat(0.6, 0.99),
    emotions: sentiment.emotions,
    keywords: sentiment.keywords
  };

  return { ...post, sentiment: sentimentResult };
}

export function generateHistoricalData(startTime: number, endTime: number, count: number): PostWithSentiment[] {
  const posts: PostWithSentiment[] = [];
  const timeSpan = endTime - startTime;

  for (let i = 0; i < count; i++) {
    const timestamp = startTime + Math.floor(Math.random() * timeSpan);
    posts.push(generatePostWithSentiment(timestamp));
  }

  return posts.sort((a, b) => a.timestamp - b.timestamp);
}

export function generateStreamPost(baseTime: number): PostWithSentiment {
  const jitter = randomInt(-5000, 5000);
  return generatePostWithSentiment(baseTime + jitter);
}
