import React from 'react';
import { X, Trophy, Sparkles, Brain, Music, Layers, Zap, Clock } from 'lucide-react';

export default function MemoryHowToPlayModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border-2 border-indigo-500/40 rounded-2xl shadow-2xl p-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition"
          aria-label="닫기"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5 border-b border-indigo-500/30 pb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300">
              도촌 기억력 마스터 가이드
            </h2>
            <p className="text-xs text-indigo-300/80">두뇌의 단기 기억력과 집중력을 키우는 2가지 게임 모드!</p>
          </div>
        </div>

        {/* Mode 1 */}
        <div className="space-y-4 text-sm">
          <div className="bg-slate-800/70 border border-indigo-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-amber-300 mb-2">
              <Layers className="w-4 h-4" />
              <span>모드 1: 🃏 카드 짝 맞추기 (Card Match)</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside leading-relaxed">
              <li>뒤집힌 카드를 <strong>2장씩 클릭</strong>하여 같은 그림의 쌍을 찾아내세요.</li>
              <li>연속으로 맞추면 <strong>콤보 보너스</strong>가 누적되어 점수가 대폭 상승합니다!</li>
              <li>빠른 시간과 적은 시도 횟수로 모든 짝을 완성할수록 <strong>타임 보너스</strong>가 커집니다.</li>
              <li>동물, 디저트, 우주, 학교생활 등 원하는 <strong>테마</strong>와 난이도를 골라보세요.</li>
            </ul>
          </div>

          {/* Mode 2 */}
          <div className="bg-slate-800/70 border border-purple-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-cyan-300 mb-2">
              <Music className="w-4 h-4" />
              <span>모드 2: 🎵 멜로디 & 순서 기억 (Simon Rhythm)</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside leading-relaxed">
              <li>4가지 색상 캐릭터 버튼이 <strong>빛나며 연주하는 소리 순서</strong>를 기억하세요.</li>
              <li>연주가 끝나면 <strong>똑같은 순서대로 버튼을 클릭</strong>합니다.</li>
              <li>성공할 때마다 시퀀스가 1개씩 늘어나며 라운드가 올라갑니다!</li>
              <li>순간 집중력과 청각 기억력을 발휘해 최고 라운드 기록을 세워보세요.</li>
            </ul>
          </div>

          {/* Score & Ranking Tips */}
          <div className="bg-slate-800/70 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 font-bold text-emerald-300 mb-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>🏆 명예의 전당 랭킹 등록 규칙</span>
            </div>
            <ul className="space-y-1.5 text-xs text-slate-300 list-disc list-inside leading-relaxed">
              <li>게임 종료 후 <strong>100점 초과</strong> 달성 시 학교 명예의 전당에 점수를 등록할 수 있습니다.</li>
              <li>높은 난이도와 연속 콤보를 유지하면 학교 최고 기록의 주인공이 될 수 있습니다!</li>
            </ul>
          </div>
        </div>

        {/* Start Button */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-95"
          >
            이해했어요! 게임 시작하기 ✨
          </button>
        </div>
      </div>
    </div>
  );
}
