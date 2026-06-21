import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Heart, Share2, MessageCircle } from 'lucide-react';
import type { PostWithSentiment, Platform } from '../../../shared/types';
import { cn } from '../../lib/utils';

interface PostStreamProps {
  posts: PostWithSentiment[];
  maxDisplay?: number;
}

const PLATFORM_ICONS: Record<Platform, string> = {
  weibo: 'W',
  wechat: 'V',
  douyin: 'D',
  xiaohongshu: 'X',
  bilibili: 'B'
};

const PLATFORM_COLORS: Record<Platform, string> = {
  weibo: 'bg-red-500',
  wechat: 'bg-green-500',
  douyin: 'bg-black',
  xiaohongshu: 'bg-pink-500',
  bilibili: 'bg-cyan-500'
};

function getSentimentBadge(polarity: number) {
  if (polarity > 0.3) {
    return (
      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400">
        正面
      </span>
    );
  } else if (polarity < -0.3) {
    return (
      <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
        负面
      </span>
    );
  }
  return (
    <span className="rounded-full bg-slate-500/20 px-2 py-0.5 text-xs font-medium text-slate-400">
      中性
    </span>
  );
}

export default function PostStream({ posts, maxDisplay = 20 }: PostStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [displayPosts, setDisplayPosts] = useState<PostWithSentiment[]>([]);
  const [newPostIds, setNewPostIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const sorted = [...posts]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, maxDisplay);

    const prevIds = new Set(displayPosts.map(p => p.id));
    const newIds = new Set(sorted.filter(p => !prevIds.has(p.id)).map(p => p.id));

    setDisplayPosts(sorted);
    setNewPostIds(newIds);

    setTimeout(() => setNewPostIds(new Set()), 2000);
  }, [posts, maxDisplay]);

  useEffect(() => {
    if (containerRef.current && displayPosts.length > 0) {
      containerRef.current.scrollTop = 0;
    }
  }, [displayPosts.length]);

  return (
    <div
      ref={containerRef}
      className="h-full overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700"
    >
      <div className="space-y-3">
        {displayPosts.map((post, index) => (
          <div
            key={post.id}
            className={cn(
              'group relative rounded-xl border border-slate-700/50 bg-slate-800/30 p-3',
              'transition-all duration-500 backdrop-blur-sm',
              'hover:border-slate-600 hover:bg-slate-800/50',
              newPostIds.has(post.id) && 'animate-pulse border-blue-500/50 bg-blue-500/10'
            )}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            {newPostIds.has(post.id) && (
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-ping rounded-full bg-blue-500" />
            )}

            <div className="flex items-start gap-3">
              <div className={cn(
                'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white',
                PLATFORM_COLORS[post.platform]
              )}>
                {PLATFORM_ICONS[post.platform]}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(post.timestamp).toLocaleTimeString('zh-CN')}
                  </span>
                  {getSentimentBadge(post.sentiment.polarity)}
                </div>

                <p className="mt-1 text-sm text-slate-300 line-clamp-2 group-hover:line-clamp-none transition-all">
                  {post.content}
                </p>

                <div className="mt-2 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    {post.likes}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {post.comments}
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3 w-3" />
                    {post.shares}
                  </span>
                  <span className="text-slate-600">
                    置信度: {(post.sentiment.confidence * 100).toFixed(0)}%
                  </span>
                </div>

                {post.sentiment.keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {post.sentiment.keywords.slice(0, 3).map(kw => (
                      <span
                        key={kw}
                        className="rounded bg-slate-700/50 px-1.5 py-0.5 text-[10px] text-slate-400"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
