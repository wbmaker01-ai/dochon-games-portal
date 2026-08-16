import React from 'react';
import { Play, Lock, Heart } from 'lucide-react';

export default function GameCard({
  id,
  title,
  category,
  imageSrc,
  isPlayable,
  onPlay,
  badgeText,
  isFavorite,
  onToggleFavorite,
  topScore
}) {
  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  return (
    <div
      onClick={isPlayable ? onPlay : undefined}
      className={`game-tile-card ${isPlayable ? 'playable' : 'coming-soon'}`}
      style={{ maxWidth: '135px', width: '100%' }}
    >
      {/* 1:1 Aspect Ratio Fixed Thumbnail Frame */}
      <div className="game-tile-thumb" style={{ width: '100%', height: '135px', aspectRatio: '1 / 1' }}>
        <img
          src={imageSrc}
          alt={title}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          loading="lazy"
        />

        {/* Favorite Heart Button (Top Right) */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`game-favorite-btn ${isFavorite ? 'active' : ''}`}
          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-white/80'}`} />
        </button>

        {/* Hover Overlay */}
        <div className="game-tile-overlay">
          {isPlayable ? (
            <div className="game-tile-play-btn">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          ) : (
            <span className="game-tile-lock-badge">
              <Lock className="w-3 h-3 inline mr-1 text-slate-300" />
              준비 중
            </span>
          )}
        </div>

        {/* Badge Tag */}
        {badgeText && (
          <div className="game-tile-badge">
            {badgeText}
          </div>
        )}
      </div>

      {/* Info Below Thumbnail */}
      <div className="game-tile-info">
        <div className="game-tile-title" title={title}>
          {title}
        </div>
        
        {/* Top Score or Category Display */}
        {isPlayable && topScore ? (
          <div className="game-tile-champion-chip" title={`최고 점수: ${topScore.name} (${topScore.score.toLocaleString()}${id === 'dino' || id === 'gnome' ? 'm' : '점'})`}>
            👑 {topScore.score.toLocaleString()}{id === 'dino' || id === 'gnome' ? 'm' : '점'}
          </div>
        ) : (
          <div className="game-tile-category">
            {category}
          </div>
        )}
      </div>
    </div>
  );
}
