'use client'

import { useState, useEffect } from 'react'
import type { Word, StudyType } from '@/types'
import SpeakButton from './SpeakButton'

interface FlipCardProps {
  word: Word
  studyType: StudyType
  isFlipped: boolean
  onFlip: () => void
  isFavorited?: boolean
  onToggleFavorite?: () => void
  onDictation?: () => void
  onMemoSave?: (memo: string) => Promise<void>
}

export default function FlipCard({ word, studyType, isFlipped, onFlip, isFavorited, onToggleFavorite, onDictation, onMemoSave }: FlipCardProps) {
  const isSent = studyType === 'sent'
  const [editingMemo, setEditingMemo] = useState(false)
  const [memoText, setMemoText] = useState(word.memo ?? '')
  const [memoSaving, setMemoSaving] = useState(false)
  const [memoError, setMemoError] = useState('')

  useEffect(() => {
    setMemoText(word.memo ?? '')
    setEditingMemo(false)
    setMemoError('')
  }, [word.id])

  const handleMemoSave = async () => {
    if (!onMemoSave) return
    setMemoSaving(true)
    setMemoError('')
    try {
      await onMemoSave(memoText)
      setEditingMemo(false)
    } catch {
      setMemoError('저장 실패')
    } finally {
      setMemoSaving(false)
    }
  }

  return (
    <div
      style={{ width: '100%', perspective: '1000px', cursor: 'pointer', userSelect: 'none' }}
      onClick={onFlip}
    >
      <div className={`flipper${isFlipped ? ' flipped' : ''}`}>
        {/* 앞면 */}
        <div className="card-face" style={{ zIndex: isFlipped ? 0 : 1 }}>
          {onToggleFavorite && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFavorite() }}
              title={isFavorited ? '즐겨찾기 해제' : '즐겨찾기 추가'}
              style={{
                position: 'absolute',
                top: '14px',
                right: '14px',
                background: 'none',
                border: 'none',
                fontSize: '1.6rem',
                lineHeight: 1,
                cursor: 'pointer',
                color: isFavorited ? '#f6ad55' : 'rgba(0,0,0,0.18)',
                transition: 'color 0.15s',
                padding: '4px',
              }}
            >
              {isFavorited ? '★' : '☆'}
            </button>
          )}
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
          <a
            href={`https://ja.dict.naver.com/#/search?query=${encodeURIComponent(word.jp)}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            title="네이버 일본어 사전 검색"
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1.5px solid var(--border)',
              background: 'var(--btn-bg)',
              color: 'var(--text-sub)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              textDecoration: 'none',
            }}
          >
            📖
          </a>
          {onDictation && (
            <button
              onClick={e => { e.stopPropagation(); onDictation() }}
              title="받아쓰기"
              style={{
                position: 'absolute',
                bottom: '14px',
                right: '14px',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1.5px solid var(--border)',
                background: 'var(--btn-bg)',
                color: 'var(--text-sub)',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              ✏️
            </button>
          )}
        </div>

        {/* 뒷면 */}
        <div className="card-face card-back" style={{ justifyContent: isSent ? 'flex-start' : 'center', paddingTop: isSent ? '28px' : '36px' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--primary-light)', marginBottom: '6px' }}>
            {isSent ? 'Translation · Reading' : 'Reading · Meaning'}
          </div>
          {isSent ? (
            <>
              <div style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>{word.ko}</div>
              <div style={{ width: '40px', height: '2px', background: 'var(--border)', borderRadius: '2px' }} />
              <div style={{ fontSize: '1.4rem', color: 'var(--primary)', fontWeight: 500, textAlign: 'center' }}>{word.hira}</div>

              {/* 메모 섹션 */}
              <div
                style={{ width: '100%', marginTop: '8px' }}
                onClick={e => e.stopPropagation()}
              >
                <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: '4px 0 10px' }} />
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-sub)' }}>
                    메모
                  </span>
                  {!editingMemo && (
                    <button
                      onClick={() => setEditingMemo(true)}
                      title="메모 편집"
                      style={{ background: 'none', border: 'none', color: 'var(--text-sub)', fontSize: '0.88rem', cursor: 'pointer', padding: '2px 4px', lineHeight: 1 }}
                    >
                      ✎
                    </button>
                  )}
                </div>
                {editingMemo ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <textarea
                      value={memoText}
                      onChange={e => setMemoText(e.target.value)}
                      placeholder="주요 표현, 문법 등을 메모하세요"
                      autoFocus
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '8px 10px',
                        border: '1.5px solid var(--primary-light)',
                        borderRadius: '8px',
                        fontSize: '0.85rem',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        resize: 'vertical',
                        fontFamily: 'inherit',
                        lineHeight: 1.6,
                        outline: 'none',
                      }}
                    />
                    {memoError && <div style={{ fontSize: '0.78rem', color: '#e53e3e' }}>{memoError}</div>}
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={handleMemoSave}
                        disabled={memoSaving}
                        style={{ flex: 1, padding: '7px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', opacity: memoSaving ? 0.7 : 1 }}
                      >
                        {memoSaving ? '저장 중...' : '저장'}
                      </button>
                      <button
                        onClick={() => { setMemoText(word.memo ?? ''); setEditingMemo(false); setMemoError('') }}
                        style={{ flex: 1, padding: '7px', background: 'var(--btn-bg)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.82rem', cursor: 'pointer' }}
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  word.memo ? (
                    <div style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
                      {word.memo}
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', fontStyle: 'italic' }}>
                      메모 없음
                    </div>
                  )
                )}
              </div>
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
    </div>
  )
}
