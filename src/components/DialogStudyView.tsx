'use client'

import { useState } from 'react'
import type { DialogSetData, DialogLine, DialogVocab, DialogExpression } from '@/types'
import SpeakButton from './SpeakButton'

interface DialogStudyViewProps {
  data: DialogSetData
}

type Section = 'lines' | 'vocab' | 'expressions'

interface FlipCardItem {
  front: string
  back: string
  sub?: string   // 후리가나 (back 첫 줄)
  speaker?: 'A' | 'B'
}

function toFlipItems(
  section: Section,
  data: DialogSetData,
): FlipCardItem[] {
  if (section === 'lines') {
    return data.lines.map(l => ({
      front: l.jp,
      sub: l.hira,
      back: l.ko,
      speaker: l.speaker,
    }))
  }
  if (section === 'vocab') {
    return data.vocab.map(v => ({ front: v.jp, sub: v.hira, back: v.ko }))
  }
  return data.expressions.map(e => ({ front: e.jp, sub: e.hira, back: e.ko }))
}

const SECTION_LABELS: Record<Section, string> = {
  lines: '대화 스크립트',
  vocab: '주요 단어',
  expressions: '주요 표현',
}

const SPEAKER_COLORS: Record<'A' | 'B', { bg: string; color: string }> = {
  A: { bg: '#e8f5ff', color: '#1a6fb5' },
  B: { bg: '#f0fff4', color: '#276749' },
}

export default function DialogStudyView({ data }: DialogStudyViewProps) {
  const [section, setSection] = useState<Section>('lines')
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)

  const items = toFlipItems(section, data)
  const current = items[index] ?? null
  const total = items.length

  const changeSection = (s: Section) => {
    setSection(s)
    setIndex(0)
    setFlipped(false)
  }

  const prev = () => {
    if (index === 0) return
    setIndex(i => i - 1)
    setFlipped(false)
  }

  const next = () => {
    if (index >= total - 1) return
    setIndex(i => i + 1)
    setFlipped(false)
  }

  const counts: Record<Section, number> = {
    lines: data.lines.length,
    vocab: data.vocab.length,
    expressions: data.expressions.length,
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '14px' }}>

      {/* 섹션 탭 */}
      <div style={{
        display: 'flex',
        background: 'var(--card-bg)',
        borderRadius: '12px',
        padding: '4px',
        gap: '4px',
        boxShadow: '0 1px 6px var(--shadow)',
      }}>
        {(['lines', 'vocab', 'expressions'] as Section[]).map(s => (
          <button
            key={s}
            onClick={() => changeSection(s)}
            style={{
              flex: 1,
              padding: '8px 4px',
              border: 'none',
              borderRadius: '9px',
              background: section === s ? 'var(--primary)' : 'transparent',
              color: section === s ? '#fff' : 'var(--text-sub)',
              fontSize: '0.72rem',
              fontWeight: section === s ? 700 : 400,
              cursor: 'pointer',
              lineHeight: 1.3,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {SECTION_LABELS[s]}
            <br />
            <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{counts[s]}개</span>
          </button>
        ))}
      </div>

      {/* 플립 카드 영역 */}
      {total === 0 ? (
        <div style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-sub)', fontSize: '0.9rem',
        }}>
          등록된 내용이 없습니다
        </div>
      ) : (
        <>
          {/* 진행 표시 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
              {index + 1} / {total}
            </span>
          </div>

          {/* 프로그레스 바 */}
          <div style={{ height: '4px', background: 'var(--border)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${((index + 1) / total) * 100}%`,
              background: 'var(--primary)',
              borderRadius: '2px',
              transition: 'width 0.2s',
            }} />
          </div>

          {/* 카드 */}
          <div
            onClick={() => setFlipped(f => !f)}
            style={{
              flex: 1,
              minHeight: '220px',
              background: 'var(--card-bg)',
              borderRadius: '20px',
              boxShadow: '0 4px 20px var(--shadow)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '28px 24px',
              cursor: 'pointer',
              userSelect: 'none',
              border: '1.5px solid var(--border)',
              gap: '12px',
              position: 'relative',
            }}
          >
            {/* 발화자 뱃지 (대화 섹션) */}
            {section === 'lines' && current?.speaker && (
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                padding: '3px 12px',
                borderRadius: '20px',
                background: SPEAKER_COLORS[current.speaker].bg,
                color: SPEAKER_COLORS[current.speaker].color,
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.05em',
              }}>
                {current.speaker}
              </div>
            )}

            {!flipped ? (
              /* 앞면: 일본어 */
              <>
                <div style={{
                  fontSize: total > 30 ? '1.1rem' : '1.35rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                  wordBreak: 'break-all',
                }}>
                  {current?.front}
                </div>
                {current?.sub && <SpeakButton hira={current.sub} />}
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                  탭하여 뒤집기
                </div>
              </>
            ) : (
              /* 뒷면: 후리가나 + 한국어 */
              <>
                <div style={{
                  fontSize: '0.95rem',
                  color: 'var(--primary)',
                  fontWeight: 600,
                  textAlign: 'center',
                  lineHeight: 1.6,
                  wordBreak: 'break-all',
                }}>
                  {current?.sub}
                </div>
                <div style={{
                  width: '32px',
                  height: '1.5px',
                  background: 'var(--border)',
                  borderRadius: '1px',
                }} />
                <div style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: 'var(--text)',
                  textAlign: 'center',
                  lineHeight: 1.5,
                }}>
                  {current?.back}
                </div>
              </>
            )}
          </div>

          {/* 이전 / 다음 버튼 */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={prev}
              disabled={index === 0}
              style={{
                flex: 1, padding: '14px',
                background: 'var(--card-bg)',
                border: '1.5px solid var(--border)',
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                color: index === 0 ? 'var(--border)' : 'var(--primary)',
                cursor: index === 0 ? 'default' : 'pointer',
                transition: 'color 0.15s',
              }}
            >
              ← 이전
            </button>
            <button
              onClick={next}
              disabled={index >= total - 1}
              style={{
                flex: 1, padding: '14px',
                background: index >= total - 1 ? 'var(--card-bg)' : 'var(--primary)',
                border: '1.5px solid ' + (index >= total - 1 ? 'var(--border)' : 'var(--primary)'),
                borderRadius: '12px',
                fontSize: '1rem',
                fontWeight: 700,
                color: index >= total - 1 ? 'var(--border)' : '#fff',
                cursor: index >= total - 1 ? 'default' : 'pointer',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              다음 →
            </button>
          </div>
        </>
      )}
    </div>
  )
}
