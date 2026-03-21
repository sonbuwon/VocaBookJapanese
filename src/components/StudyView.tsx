'use client'

import { useState, useEffect } from 'react'
import type { Word, StudyType, CardMode } from '@/types'
import { shuffle } from '@/lib/utils'
import FlipCard from './FlipCard'

interface StudyViewProps {
  words: Word[]
  studyType: StudyType
}

export default function StudyView({ words, studyType }: StudyViewProps) {
  const [mode, setModeState] = useState<CardMode>('saved')
  const [deck, setDeck] = useState<Word[]>(words)
  const [current, setCurrent] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  useEffect(() => {
    setDeck(words)
    setCurrent(0)
    setIsFlipped(false)
    setModeState('saved')
  }, [words])

  const setMode = (m: CardMode) => {
    setModeState(m)
    setDeck(m === 'random' ? shuffle(words) : [...words])
    setCurrent(0)
    setIsFlipped(false)
  }

  const navigate = (dir: number) => {
    let next = current + dir
    if (mode === 'saved') {
      if (next < 0) next = deck.length - 1
      else if (next >= deck.length) next = 0
    } else {
      if (next < 0 || next >= deck.length) return
    }
    setCurrent(next)
    setIsFlipped(false)
  }

  const sortBtnBase: React.CSSProperties = {
    flex: 1,
    padding: '9px 0',
    border: '1.5px solid var(--primary-light)',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'background 0.18s, color 0.18s',
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      {/* 모드 버튼 */}
      <div style={{ width: '100%', maxWidth: '480px', display: 'flex', gap: '10px', padding: '14px 16px 0' }}>
        <button
          style={{
            ...sortBtnBase,
            background: mode === 'saved' ? 'var(--btn-active-bg)' : 'var(--btn-bg)',
            color: mode === 'saved' ? 'var(--btn-active-text)' : 'var(--primary)',
            borderColor: mode === 'saved' ? 'var(--btn-active-bg)' : 'var(--primary-light)',
          }}
          onClick={() => setMode('saved')}
        >
          저장순
        </button>
        <button
          style={{
            ...sortBtnBase,
            background: mode === 'random' ? 'var(--btn-active-bg)' : 'var(--btn-bg)',
            color: mode === 'random' ? 'var(--btn-active-text)' : 'var(--primary)',
            borderColor: mode === 'random' ? 'var(--btn-active-bg)' : 'var(--primary-light)',
          }}
          onClick={() => setMode('random')}
        >
          랜덤순
        </button>
      </div>

      {/* 카운터 */}
      <div style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-sub)', letterSpacing: '0.05em' }}>
        {deck.length > 0 ? `${current + 1} / ${deck.length}` : ''}
      </div>

      {/* 카드 영역 */}
      <div style={{ flex: 1, width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 16px 10px' }}>
        {deck.length > 0 ? (
          <FlipCard
            word={deck[current]}
            studyType={studyType}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(f => !f)}
          />
        ) : (
          <p style={{ color: 'var(--text-sub)', fontSize: '1rem', textAlign: 'center', padding: '60px 20px' }}>항목이 없습니다.</p>
        )}
      </div>

      {/* 네비게이션 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '20px', width: '100%', maxWidth: '480px', padding: '0 16px', justifyContent: 'center' }}>
        <button
          onClick={() => navigate(-1)}
          disabled={mode === 'random' && current === 0}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            border: '1.5px solid var(--border)',
            background: 'var(--card-bg)',
            color: 'var(--primary)',
            fontSize: '1.4rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px var(--shadow)',
            transition: 'background 0.15s, color 0.15s',
            opacity: (mode === 'random' && current === 0) ? 0.3 : 1,
          }}
        >
          ←
        </button>
        <button
          onClick={() => navigate(1)}
          disabled={mode === 'random' && current === deck.length - 1}
          style={{
            width: '52px', height: '52px', borderRadius: '50%',
            border: '1.5px solid var(--border)',
            background: 'var(--card-bg)',
            color: 'var(--primary)',
            fontSize: '1.4rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px var(--shadow)',
            transition: 'background 0.15s, color 0.15s',
            opacity: (mode === 'random' && current === deck.length - 1) ? 0.3 : 1,
          }}
        >
          →
        </button>
      </div>

      <div style={{ fontSize: '0.78rem', color: '#bbb', textAlign: 'center', marginTop: '16px', marginBottom: '8px' }}>
        카드를 탭하면 뒤집힙니다
      </div>
    </div>
  )
}
