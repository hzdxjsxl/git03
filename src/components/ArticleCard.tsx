import { memo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Tag } from 'lucide-react';
import type { ArticleMeta } from '../../shared/types';
import { cn } from '../lib/utils';

interface ArticleCardProps {
  article: ArticleMeta;
  index?: number;
  style?: React.CSSProperties;
}

const formatTime = (timestamp: number): string => {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return new Date(timestamp).toLocaleDateString('zh-CN');
};

export const ArticleCard = memo(function ArticleCard({
  article,
  style,
}: ArticleCardProps) {
  return (
    <Link
      to={`/article/${article.id}`}
      style={style}
      className="block group"
    >
      <article className="bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 h-full">
        <div className="relative aspect-[16/9] overflow-hidden">
          <img
            src={article.cover}
            alt={article.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute top-3 left-3">
            <span className="px-2 py-1 bg-blue-500/90 text-white text-xs font-medium rounded-md">
              {article.category}
            </span>
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors duration-200">
            {article.title}
          </h3>

          <p className="text-zinc-400 text-sm mb-3 line-clamp-2">
            {article.summary}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {article.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-zinc-700/50 text-zinc-300 text-xs rounded-md"
              >
                <Tag size={10} />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span className="font-medium text-zinc-400">{article.author}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {formatTime(article.publishTime)}
              </span>
              <span className="flex items-center gap-1">
                <Eye size={12} />
                {article.readCount}
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
});
