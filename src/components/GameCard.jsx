import React from 'react';
import { Play } from 'lucide-react';

export default function GameCard({
  title,
  category,
  imageSrc,
  isPlayable,
  onPlay,
  badgeText
}) {
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

        {/* Hover Overlay */}
        <div className="game-tile-overlay">
          {isPlayable ? (
            <div className="game-tile-play-btn">
              <Play className="w-5 h-5 fill-current ml-0.5" />
            </div>
          ) : (
            <span style={{ fontSize: '10px', fontWeight: 900, background: '#0F172A', color: '#CBD5E1', padding: '4px 8px', borderRadius: '6px' }}>
              준비중
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
        <div className="game-tile-category">
          {category}
        </div>
      </div>
    </div>
  );
}
