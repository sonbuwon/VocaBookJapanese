'use client'

import type { StudyType, WordSet } from '@/types'
import { FAVORITES_SET_ID } from '@/lib/favorites-client'

interface SetListViewProps {
  sets: WordSet[]
  studyType: StudyType
  favoritesCount: number
  onSelect: (setId: string) => void
}

export default function SetListView({ sets, studyType, favoritesCount, onSelect }: SetListViewProps) {
  const label = studyType === 'word' ? '단어' : '문장'

  const cardStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    borderRadius: '14px',
    boxShadow: '0 2px 12px var(--shadow)',
    padding: '18px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    border: '1.5px solid transparent',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    gap: '12px',
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <p style={{ width: '100%', maxWidth: '480px', padding: '20px 16px 8px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
        학습할 {label} 세트를 선택하세요
      </p>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* 즐겨찾기 세트 */}
        <div
          onClick={() => onSelect(FAVORITES_SET_ID)}
          style={{
            ...cardStyle,
            background: favoritesCount > 0 ? '#fffbeb' : 'var(--card-bg)',
            border: favoritesCount > 0 ? '1.5px solid #f6d860' : '1.5px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '1.5rem', width: '36px', textAlign: 'center', flexShrink: 0 }}>★</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '1.05rem', fontWeight: 700, color: '#b7791f', marginBottom: '4px' }}>즐겨찾기</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
              {favoritesCount > 0 ? `${favoritesCount}개 ${label}` : `저장된 ${label} 없음`}
            </div>
          </div>
          <div style={{ fontSize: '1.2rem', color: '#d97706', flexShrink: 0 }}>›</div>
        </div>

        {/* 일반 세트 목록 */}
        {sets.map(set => (
          <div
            key={set.id}
            onClick={() => onSelect(set.id)}
            style={cardStyle}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{set.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{set.word_count ?? 0}개 {label}</div>
            </div>
            <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)', flexShrink: 0 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
