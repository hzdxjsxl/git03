import React, { useEffect, useRef, useState } from 'react';
import { RecommendationResult } from '../types';
import { apiClient } from '../utils/api';

interface ProductCardProps {
  result: RecommendationResult;
  registerElement: (id: string, element: HTMLElement | null) => void;
  isReRanked?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  result,
  registerElement,
  isReRanked = false,
}) => {
  const { product, score, rank, reasoning, frontendScore } = result;
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (cardRef.current) {
      registerElement(product.id, cardRef.current);
    }
    return () => {
      registerElement(product.id, null);
    };
  }, [product.id, registerElement]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
            apiClient.recordBehavior('view', product.id).catch(() => {});
          }
        });
      },
      { threshold: 0.3 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [product.id, isVisible]);

  const handleClick = () => {
    apiClient.recordBehavior('click', product.id).catch(() => {});
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    apiClient.recordBehavior('like', product.id).catch(() => {});
  };

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const displayScore = isReRanked && frontendScore !== undefined ? frontendScore : score;

  return (
    <div
      ref={cardRef}
      className="product-card"
      onClick={handleClick}
      style={{
        opacity: imageLoaded ? 1 : 0,
        transform: imageLoaded ? 'translateY(0)' : 'translateY(10px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
      }}
    >
      <div className="product-image-container">
        {!imageLoaded && <div className="product-skeleton" />}
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}
        <button
          className="like-button"
          onClick={handleLike}
          aria-label="喜欢"
        >
          ♡
        </button>
      </div>
      
      <div className="product-info">
        <h3 className="product-title" title={product.name}>
          {product.name}
        </h3>
        
        <div className="product-meta">
          <span className="product-rating">
            ★ {product.rating.toFixed(1)}
            <span className="review-count">({product.reviewCount})</span>
          </span>
          <span className="sales-count">已售 {formatSales(product.sales)}</span>
        </div>
        
        <div className="product-price">
          <span className="current-price">¥{product.price}</span>
          {product.originalPrice && (
            <span className="original-price">¥{product.originalPrice}</span>
          )}
        </div>
        
        <div className="product-tags">
          {product.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">
              {tag}
            </span>
          ))}
        </div>
        
        <div className="reasoning">
          {reasoning.slice(0, 2).map((r, i) => (
            <span key={i} className="reasoning-tag">
              {r}
            </span>
          ))}
        </div>
        
        <div className="score-indicator">
          <div className="score-bar">
            <div
              className="score-fill"
              style={{ width: `${displayScore * 100}%` }}
            />
          </div>
          <span className="score-text">
            匹配度 {(displayScore * 100).toFixed(0)}%
          </span>
          {isReRanked && <span className="rerank-badge">智能重排</span>}
        </div>
      </div>
    </div>
  );
};

function formatSales(sales: number): string {
  if (sales >= 10000) {
    return `${(sales / 10000).toFixed(1)}万`;
  }
  return sales.toString();
}
