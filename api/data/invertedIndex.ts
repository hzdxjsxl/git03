import type { ArticleMeta } from '../../shared/types';

export class InvertedIndex {
  private index: Map<string, Set<string>> = new Map();
  private articles: Map<string, ArticleMeta> = new Map();
  private allArticleIds: string[] = [];

  addArticle(article: ArticleMeta): void {
    this.articles.set(article.id, article);
    this.allArticleIds.push(article.id);
    
    const terms = [
      ...article.keywords,
      ...article.tags,
      article.category,
      article.author,
    ];
    
    for (const term of terms) {
      const normalizedTerm = term.toLowerCase();
      if (!this.index.has(normalizedTerm)) {
        this.index.set(normalizedTerm, new Set());
      }
      this.index.get(normalizedTerm)!.add(article.id);
    }
  }

  search(features: Array<{ word: string; weight: number }>, excludeIds: Set<string> = new Set()): string[] {
    const scores: Map<string, number> = new Map();
    
    for (const feature of features) {
      const term = feature.word.toLowerCase();
      const matchingIds = this.index.get(term);
      
      if (matchingIds) {
        for (const id of matchingIds) {
          if (!excludeIds.has(id)) {
            const current = scores.get(id) || 0;
            scores.set(id, current + feature.weight);
          }
        }
      }
    }
    
    if (scores.size === 0) {
      return this.allArticleIds.filter(id => !excludeIds.has(id));
    }
    
    return Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => id);
  }

  getArticle(id: string): ArticleMeta | undefined {
    return this.articles.get(id);
  }

  getArticles(ids: string[]): ArticleMeta[] {
    return ids.map(id => this.articles.get(id)).filter((a): a is ArticleMeta => a !== undefined);
  }

  getRandomArticles(count: number, excludeIds: Set<string> = new Set()): string[] {
    const available = this.allArticleIds.filter(id => !excludeIds.has(id));
    const shuffled = [...available].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  size(): number {
    return this.articles.size;
  }
}

export const createSearchIndex = (articles: ArticleMeta[]): InvertedIndex => {
  const index = new InvertedIndex();
  for (const article of articles) {
    index.addArticle(article);
  }
  return index;
};
