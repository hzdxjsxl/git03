import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { marked } from 'marked';
import { ArrowLeft, Clock, Eye, User, Calendar, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import type { ArticleMeta, ArticleContent } from '../../shared/types';
import { articlesApi } from '../utils/api';
import { useReadingTracker } from '../hooks/useReadingTracker';
import { useFeedStore } from '../store/useFeedStore';
import { cn } from '../lib/utils';

export default function ArticleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<ArticleMeta | null>(null);
  const [content, setContent] = useState<ArticleContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const addFeature = useFeedStore(state => state.addFeature);
  
  const { handleScroll, currentReadTime, currentScrollDepth } = useReadingTracker(article);

  useEffect(() => {
    if (!id) return;

    const loadArticle = async () => {
      setLoading(true);
      setError(null);
      try {
        const [meta, articleContent] = await Promise.all([
          articlesApi.getMeta(id),
          articlesApi.getContent(id),
        ]);
        setArticle(meta);
        setContent(articleContent);
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败');
      } finally {
        setLoading(false);
      }
    };

    loadArticle();
  }, [id]);

  useEffect(() => {
    const handleScrollEvent = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        handleScroll(scrollTop, scrollHeight, clientHeight);
      }
    };

    window.addEventListener('scroll', handleScrollEvent);
    return () => window.removeEventListener('scroll', handleScrollEvent);
  }, [handleScroll]);

  useEffect(() => {
    if (content?.keywords) {
      const timer = setTimeout(() => {
        content.keywords.forEach((keyword) => {
          addFeature(keyword, 0.5);
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [content?.keywords, addFeature]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 animate-pulse">
        <div className="h-8 bg-zinc-700 rounded w-3/4 mb-4" />
        <div className="flex gap-4 mb-8">
          <div className="h-4 bg-zinc-700 rounded w-20" />
          <div className="h-4 bg-zinc-700 rounded w-24" />
        </div>
        <div className="aspect-video bg-zinc-700 rounded-xl mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-zinc-700 rounded"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (error || !article || !content) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-zinc-400 mb-4">{error || '文章不存在'}</p>
        <Link
          to="/"
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <article className="max-w-3xl mx-auto">
      <div className="sticky top-16 z-10 bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800 -mx-4 px-4 py-3 mb-6">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={18} />
            <span>返回</span>
          </button>
          
          <div className="flex items-center gap-4 text-xs text-zinc-500">
            <span>阅读: {Math.floor(currentReadTime / 1000)}s</span>
            <span>进度: {currentScrollDepth.toFixed(0)}%</span>
          </div>
        </div>
      </div>

      <header className="mb-8">
        <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full mb-4">
          {article.category}
        </span>
        
        <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-400 mb-6">
          <span className="flex items-center gap-1.5">
            <User size={14} />
            {article.author}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {formatDate(article.publishTime)}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={14} />
            {article.readCount} 阅读
          </span>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-800 text-zinc-300 text-sm rounded-md"
            >
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>

        <img
          src={article.cover}
          alt={article.title}
          className="w-full aspect-video object-cover rounded-xl"
        />
      </header>

      <div
        ref={contentRef}
        className="prose prose-invert prose-zinc max-w-none"
        dangerouslySetInnerHTML={{ __html: marked(content.content) }}
      />

      <footer className="mt-12 pt-8 border-t border-zinc-800">
        <div className="bg-zinc-800/50 rounded-xl p-4">
          <h4 className="text-sm font-medium text-zinc-300 mb-3">提取的关键词</h4>
          <div className="flex flex-wrap gap-2">
            {content.keywords.map((keyword) => (
              <span
                key={keyword}
                className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-sm rounded-md"
              >
                {keyword}
              </span>
            ))}
          </div>
          <p className="text-xs text-zinc-500 mt-3">
            这些关键词已自动添加到您的兴趣特征中
          </p>
        </div>
      </footer>
    </article>
  );
}
