'use client'

import type { StudyType } from '@/types'

interface MenuViewProps {
  wordSetCount: number
  wordCount: number
  sentSetCount: number
  sentCount: number
  onSelect: (type: StudyType) => void
}

export default function MenuView({
  wordSetCount, wordCount, sentSetCount, sentCount, onSelect
}: MenuViewProps) {
  const menuBtnStyle: React.CSSProperties = {
    background: 'var(--card-bg)',
    borderRadius: '16px',
    boxShadow: '0 2px 12px var(--shadow)',
    padding: '28px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    cursor: 'pointer',
    border: '1.5px solid transparent',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    width: '100%',
  }

  return (
    <div style={{
      width: '100%',
      maxWidth: '480px',
      padding: '32px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px',
      flex: 1,
    }}>
      <div
        style={menuBtnStyle}
        onClick={() => onSelect('word')}
        onMouseDown={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--primary-light)'
          el.style.boxShadow = '0 4px 20px rgba(45,106,79,0.15)'
        }}
        onMouseUp={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'transparent'
          el.style.boxShadow = '0 2px 12px var(--shadow)'
        }}
      >
        <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--primary)', width: '52px', textAlign: 'center', flexShrink: 0 }}>単</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>단어 외우기</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{wordSetCount}개 세트 · {wordCount}개 단어</div>
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>›</div>
      </div>

      <div
        style={menuBtnStyle}
        onClick={() => onSelect('sent')}
        onMouseDown={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'var(--primary-light)'
          el.style.boxShadow = '0 4px 20px rgba(45,106,79,0.15)'
        }}
        onMouseUp={e => {
          const el = e.currentTarget as HTMLElement
          el.style.borderColor = 'transparent'
          el.style.boxShadow = '0 2px 12px var(--shadow)'
        }}
      >
        <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--primary)', width: '52px', textAlign: 'center', flexShrink: 0 }}>文</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>문장 외우기</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{sentSetCount}개 세트 · {sentCount}개 문장</div>
        </div>
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)' }}>›</div>
      </div>
    </div>
  )
}
