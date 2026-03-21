'use client'

import type { Word, StudyType } from '@/types'
import SpeakButton from './SpeakButton'

interface FlipCardProps {
  word: Word
  studyType: StudyType
  isFlipped: boolean
  onFlip: () => void
  isFavorited?: boolean
  onToggleFavorite?: () => void
}

export default function FlipCard({ word, studyType, isFlipped, onFlip, isFavorited, onToggleFavorite }: FlipCardProps) {
  const isSent = studyType === 'sent'

  return (
    <div
      style={{ width: '100%', perspective: '1000px', cursor: 'pointer', userSelect: 'none', position: 'relative' }}
      onClick={onFlip}
    >
      <div className={`flipper${isFlipped ? ' flipped' : ''}`}>
        {/* 앞면 */}
        <div className="card-face" style={{ zIndex: isFlipped ? 0 : 1 }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '6px' }}>
            {isSent ? 'Japanese Sentence' : 'Japanese'}
          </div>
          <div style={{
            fontSize: isSent ? '1.4rem' : '2.4rem',
            fontWeight: 700,
            color: 'var(--text)',
            textAlign: 'center',
            lineHeight: isSent ? 1.6 : 1.25,
            wordBreak: 'break-word',
          }}>
            {word.jp}
          </div>
          <SpeakButton hira={word.hira} />
          <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '8px' }}>탭해서 뜻 확인</div>
        </div>

        {/* 뒷면 */}
        <div className="card-face card-back">
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '6px' }}>
            {isSent ? 'Translation · Reading' : 'Reading · Meaning'}
          </div>
          {isSent ? (
            <>
              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{word.ko}</div>
              <div style={{ width: '40px', height: '2px', background: 'var(--border)', borderRadius: '2px' }} />
              <div style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 500, textAlign: 'center' }}>{word.hira}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 500, textAlign: 'center' }}>{word.hira}</div>
              <div style={{ width: '40px', height: '2px', background: 'var(--border)', borderRadius: '2px' }} />
              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{word.ko}</div>
            </>
          )}
        </div>
      </div>

      {/* 즐겨찾기 버튼 — 카드 위에 오버레이 */}
      {onToggleFavorite && (
        <button
          onClick={e => { e.stopPropagation(); onToggleFavorite() }}
          title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            zIndex: 10,
            background: 'none',
            border: 'none',
            fontSize: '1.6rem',
            lineHeight: 1,
            cursor: 'pointer',
            color: isFavorited ? '#f6ad55' : 'rgba(0,0,0,0.18)',
            transition: 'color 0.15s, transform 0.1s',
            padding: '4px',
          }}
        >
          {isFavorited ? '★' : '☆'}
        </button>
      )}
    </div>
  )
}
