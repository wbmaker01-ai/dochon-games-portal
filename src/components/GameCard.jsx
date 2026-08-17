import React, { useState } from 'react';
import { Play, Lock } from 'lucide-react';
import { soundFx } from '../utils/audio';
import { haptics } from '../utils/haptics';

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
  const [animState, setAnimState] = useState(''); // 'like' | 'unlike' | ''

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    const nextState = !isFavorite;
    setAnimState(nextState ? 'like' : 'unlike');

    // Play sweet chime audio and haptic feedback
    if (nextState) {
      soundFx.playFavoriteAdd();
      haptics.medium();
    } else {
      soundFx.playFavoriteRemove();
      haptics.light();
    }

    setTimeout(() => {
      setAnimState('');
    }, 600);

    if (onToggleFavorite) {
      onToggleFavorite(id);
    }
  };

  const handleCardClick = () => {
    if (isPlayable && onPlay) {
      haptics.light();
      onPlay();
    }
  };

  return (
    <div
      onClick={handleCardClick}
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

        {/* Favorite Heart Button with Dynamic Particles and Pop Animation */}
        <button
          type="button"
          onClick={handleFavoriteClick}
          className={`game-favorite-btn ${isFavorite ? 'active' : ''} ${animState ? `anim-${animState}` : ''}`}
          title={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
        >
          {/* Ripple Pulse Ring */}
          <span className="heart-ripple-ring" />

          {/* Sparkle burst particles on like */}
          {animState === 'like' && (
            <span className="heart-sparkle-container">
              <span className="heart-sparkle s1">✨</span>
              <span className="heart-sparkle s2">💖</span>
              <span className="heart-sparkle s3">⭐</span>
              <span className="heart-sparkle s4">✨</span>
            </span>
          )}

          {/* High-fidelity Curved Heart SVG Icon with Gradient Fill & Gloss Reflection */}
          <svg
            viewBox="0 0 24 24"
            className={`heart-svg ${isFavorite ? 'active' : ''}`}
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id={`heartGrad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF3366" />
                <stop offset="50%" stopColor="#FF1493" />
                <stop offset="100%" stopColor="#E11D48" />
              </linearGradient>
            </defs>

            {/* Inactive Outline Heart */}
            {!isFavorite && (
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                fill="rgba(0, 0, 0, 0.25)"
                stroke="#FFFFFF"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="heart-path-outline"
              />
            )}

            {/* Active Filled Gradient Heart with Highlight */}
            {isFavorite && (
              <>
                <path
                  d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                  fill={`url(#heartGrad-${id})`}
                  stroke="#FFE4E6"
                  strokeWidth="0.8"
                  className="heart-path-fill"
                />
                {/* Glossy Curved Highlight Dot */}
                <ellipse
                  cx="7.5"
                  cy="6.5"
                  rx="2"
                  ry="1.2"
                  transform="rotate(-30 7.5 6.5)"
                  fill="rgba(255, 255, 255, 0.85)"
                />
              </>
            )}
          </svg>
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
