'use client'

import type { WordSet } from '@/types'

interface DialogSetListViewProps {
  sets: WordSet[]
  onSelect: (setId: string) => void
}

export default function DialogSetListView({ sets, onSelect }: DialogSetListViewProps) {
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
        학습할 대화 스크립트를 선택하세요
      </p>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sets.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            등록된 대화 세트가 없습니다
          </p>
        )}
        {sets.map(set => (
          <div
            key={set.id}
            onClick={() => onSelect(set.id)}
            style={cardStyle}
          >
            <div style={{ fontSize: '1.4rem', width: '36px', textAlign: 'center', flexShrink: 0 }}>会</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>{set.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{set.line_count ?? 0}줄 대화</div>
            </div>
            <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)', flexShrink: 0 }}>›</div>
          </div>
        ))}
      </div>
    </div>
  )
}
