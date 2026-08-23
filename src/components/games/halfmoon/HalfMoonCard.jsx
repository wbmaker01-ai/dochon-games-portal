// High-Fidelity SVG Lunar Phase & Special Card Component

import React from 'react';
import { LUNAR_PHASES, SPECIAL_CARDS } from './halfmoonConstants';

export default function HalfMoonCard({
  card,
  isSelected = false,
  isPlayable = true,
  size = 'normal', // 'small', 'normal', 'large', 'board'
  onClick,
  showOwner = false,
  isWinningLine = false
}) {
  if (!card) return null;

  const isSpecial = card.type === 'SPECIAL';
  const ownerClass = card.owner === 'PLAYER' ? 'owner-player' : card.owner === 'AI' ? 'owner-ai' : '';

  // Render SVG Lunar Graphic based on Step (0 to 7)
  const renderLunarSVG = (step) => {
    // Unique Mask IDs to prevent collisions
    const maskId = `moon-mask-${card.uid || step}`;

    return (
      <svg viewBox="0 0 100 100" className="moon-svg-graphic">
        <defs>
          <radialGradient id={`glow-${maskId}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#FFF9A6" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#FFAA00" stopOpacity="0.1" />
          </radialGradient>
          <radialGradient id={`dark-${maskId}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E2337" />
            <stop offset="100%" stopColor="#0B0D17" />
          </radialGradient>
          <filter id={`bloom-${maskId}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Space Outer Glow */}
        <circle cx="50" cy="50" r="42" fill="none" stroke={card.glowColor || '#FFD166'} strokeWidth="1.5" opacity="0.3" strokeDasharray="3 3" />

        {/* Dark Lunar Body */}
        <circle cx="50" cy="50" r="36" fill={`url(#dark-${maskId})`} stroke="#313852" strokeWidth="1.5" />

        {/* Lunar Surface Craters */}
        <circle cx="40" cy="38" r="4.5" fill="#151928" opacity="0.6" />
        <circle cx="62" cy="45" r="6" fill="#151928" opacity="0.5" />
        <circle cx="48" cy="65" r="5" fill="#151928" opacity="0.6" />
        <circle cx="34" cy="56" r="3" fill="#151928" opacity="0.4" />

        {/* Light Phase Rendering based on Step */}
        {step === 0 && (
          // 0: New Moon (삭)
          <circle cx="50" cy="50" r="35" fill="#101424" stroke="#4A5568" strokeWidth="1.5" strokeDasharray="2 4" />
        )}

        {step === 1 && (
          // 1: Waxing Crescent (초승달)
          <path
            d="M 50 14 A 36 36 0 0 1 50 86 A 28 36 0 0 0 50 14 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}

        {step === 2 && (
          // 2: First Quarter (상현달 - 오른쪽 반달)
          <path
            d="M 50 14 A 36 36 0 0 1 50 86 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}

        {step === 3 && (
          // 3: Waxing Gibbous (상현망)
          <path
            d="M 50 14 A 36 36 0 0 1 50 86 A 22 36 0 0 1 50 14 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}

        {step === 4 && (
          // 4: Full Moon (보름달)
          <g filter={`url(#bloom-${maskId})`}>
            <circle cx="50" cy="50" r="36" fill={`url(#glow-${maskId})`} />
            <circle cx="42" cy="38" r="4.5" fill="#E6CA65" opacity="0.4" />
            <circle cx="62" cy="45" r="6" fill="#E6CA65" opacity="0.35" />
            <circle cx="48" cy="65" r="5" fill="#E6CA65" opacity="0.4" />
            <circle cx="34" cy="56" r="3" fill="#E6CA65" opacity="0.3" />
          </g>
        )}

        {step === 5 && (
          // 5: Waning Gibbous (하현망)
          <path
            d="M 50 14 A 36 36 0 0 0 50 86 A 22 36 0 0 0 50 14 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}

        {step === 6 && (
          // 6: Third Quarter (하현달 - 왼쪽 반달)
          <path
            d="M 50 14 A 36 36 0 0 0 50 86 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}

        {step === 7 && (
          // 7: Waning Crescent (그믐달)
          <path
            d="M 50 14 A 36 36 0 0 0 50 86 A 28 36 0 0 1 50 14 Z"
            fill={`url(#glow-${maskId})`}
            filter={`url(#bloom-${maskId})`}
          />
        )}
      </svg>
    );
  };

  // Render Special Wildcard Graphic
  const renderSpecialSVG = (specialId) => {
    return (
      <svg viewBox="0 0 100 100" className="moon-svg-graphic special-graphic animate-pulse">
        {specialId === 'SUPER_MOON' && (
          <g>
            <circle cx="50" cy="50" r="40" fill="#FF007F" opacity="0.25" />
            <circle cx="50" cy="50" r="32" fill="#FF5D8F" />
            <polygon points="50,12 59,35 84,38 65,56 70,80 50,68 30,80 35,56 16,38 41,35" fill="#FFF0F5" />
          </g>
        )}
        {specialId === 'LUNAR_ECLIPSE' && (
          <g>
            <circle cx="50" cy="50" r="38" fill="#7A0010" />
            <circle cx="50" cy="50" r="34" fill="#D90429" />
            <circle cx="42" cy="46" r="30" fill="#1A0206" />
            <circle cx="50" cy="50" r="35" fill="none" stroke="#FF4D6D" strokeWidth="2" strokeDasharray="4 2" />
          </g>
        )}
        {specialId === 'SHOOTING_STAR' && (
          <g>
            <line x1="20" y1="80" x2="75" y2="25" stroke="#70E000" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
            <polygon points="75,25 60,35 68,43" fill="#38B000" />
            <polygon points="75,25 78,15 85,22" fill="#CCFF33" />
            <circle cx="75" cy="25" r="7" fill="#FFFF3F" />
          </g>
        )}
      </svg>
    );
  };

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`halfmoon-card size-${size} ${isSelected ? 'card-selected' : ''} ${ownerClass} ${
        isWinningLine ? 'card-winning-pulse' : ''
      } ${!isPlayable ? 'card-disabled' : ''}`}
      style={{
        '--card-glow': card.glowColor || '#FFD166',
        '--card-theme': card.color || '#3A405A'
      }}
    >
      {/* Top Card Badge / Owner Tag */}
      <div className="card-top-header">
        <span className="card-phase-icon">{card.icon}</span>
        <span className="card-short-title">{card.shortName}</span>
      </div>

      {/* Main Lunar Phase / Special Vector */}
      <div className="card-center-art">
        {isSpecial ? renderSpecialSVG(card.specialId) : renderLunarSVG(card.step)}
      </div>

      {/* Bottom Subtitle / Step Index */}
      <div className="card-bottom-footer">
        {isSpecial ? (
          <span className="card-special-badge">특수</span>
        ) : (
          <span className="card-step-badge">위상 {card.step + 1}/8</span>
        )}
      </div>

      {/* Owner Glow Ring Marker (On Board) */}
      {showOwner && card.owner && (
        <div className={`card-owner-indicator ${card.owner === 'PLAYER' ? 'indicator-player' : 'indicator-ai'}`}>
          {card.owner === 'PLAYER' ? '🔵 내 카드' : '🔴 Luna'}
        </div>
      )}
    </div>
  );
}
