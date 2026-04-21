'use client'

import { useState } from 'react'
import type { StudyType, WordSet, Word } from '@/types'
import { FAVORITES_SET_ID, clearFavorites } from '@/lib/favorites-client'
import { getWords } from '@/lib/data-client'
import RelayPlayerModal from './RelayPlayerModal'

interface SetListViewProps {
  defaultSets: WordSet[]
  personalSets: WordSet[]
  studyType: StudyType
  favoritesCount: number
  onSelect: (setId: string) => void
  onFavoritesCleared: () => void
}

export default function SetListView({
  defaultSets,
  personalSets,
  studyType,
  favoritesCount,
  onSelect,
  onFavoritesCleared,
}: SetListViewProps) {
  const label = studyType === 'word' ? '단어' : '문장'
  const [clearing, setClearing] = useState(false)
  const [showDefault, setShowDefault] = useState(true)
  const [personalOpen, setPersonalOpen] = useState(true)
  const [defaultOpen, setDefaultOpen] = useState(false)

  // 릴레이 플레이어 상태
  const [relaySet, setRelaySet] = useState<WordSet | null>(null)
  const [relayWords, setRelayWords] = useState<Word[]>([])
  const [loadingRelayId, setLoadingRelayId] = useState<string | null>(null)

  const handleClearFavorites = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`즐겨찾기 ${label}을 모두 삭제하시겠습니까?`)) return
    setClearing(true)
    await clearFavorites(studyType)
    setClearing(false)
    onFavoritesCleared()
  }

  const handleRelayClick = async (e: React.MouseEvent, set: WordSet) => {
    e.stopPropagation()
    if (loadingRelayId) return
    setLoadingRelayId(set.id)
    try {
      const words = await getWords(set.id)
      setRelayWords(words)
      setRelaySet(set)
    } finally {
      setLoadingRelayId(null)
    }
  }

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

  const sectionHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '12px',
    background: 'var(--card-bg)',
    border: '1.5px solid var(--border)',
    cursor: 'pointer',
    userSelect: 'none',
  }

  const relayBtnStyle = (isLoading: boolean): React.CSSProperties => ({
    padding: '5px 10px',
    background: 'var(--btn-bg)',
    border: '1.5px solid var(--primary-light)',
    borderRadius: '8px',
    color: 'var(--primary)',
    fontSize: '0.75rem',
    fontWeight: 600,
    cursor: isLoading ? 'default' : 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    opacity: isLoading ? 0.5 : 1,
  })

  // 세트 카드 렌더 (개인/기본 공통)
  const renderSetCard = (set: WordSet) => {
    const isLoadingThis = loadingRelayId === set.id
    const hasWords = (set.word_count ?? 0) > 0
    return (
      <div
        key={set.id}
        onClick={() => onSelect(set.id)}
        style={cardStyle}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: '1.05rem', fontWeight: 700, color: 'var(--text)',
            marginBottom: '4px',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {set.name}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            {set.word_count ?? 0}개 {label}
          </div>
        </div>
        {/* 릴레이 재생 버튼 */}
        {hasWords && (
          <button
            onClick={(e) => handleRelayClick(e, set)}
            disabled={isLoadingThis || !!loadingRelayId}
            title="릴레이 음성 재생"
            style={relayBtnStyle(isLoadingThis)}
          >
            {isLoadingThis ? (
              <span style={{ fontSize: '0.7rem' }}>...</span>
            ) : (
              <>🔊<span>릴레이</span></>
            )}
          </button>
        )}
        <div style={{ fontSize: '1.2rem', color: 'var(--primary-light)', flexShrink: 0 }}>›</div>
      </div>
    )
  }

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
      <p style={{ width: '100%', maxWidth: '480px', padding: '20px 16px 8px', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
        학습할 {label} 세트를 선택하세요
      </p>
      <div style={{ width: '100%', maxWidth: '480px', padding: '0 16px 24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>

        {/* ① 즐겨찾기 세트 */}
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
          {favoritesCount > 0 && (
            <button
              onClick={handleClearFavorites}
              disabled={clearing}
              title="즐겨찾기 전체 삭제"
              style={{
                padding: '5px 10px',
                background: 'transparent',
                border: '1.5px solid #fed7aa',
                borderRadius: '8px',
                color: '#c05621',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: clearing ? 'default' : 'pointer',
                flexShrink: 0,
                opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearing ? '삭제 중' : '전체 삭제'}
            </button>
          )}
          <div style={{ fontSize: '1.2rem', color: '#d97706', flexShrink: 0 }}>›</div>
        </div>

        {/* ② 기본 제공 단어 ON/OFF 토글 버튼 */}
        <button
          onClick={() => setShowDefault(v => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 16px',
            borderRadius: '12px',
            background: showDefault ? 'var(--primary)' : 'var(--card-bg)',
            border: `1.5px solid ${showDefault ? 'var(--primary)' : 'var(--border)'}`,
            cursor: 'pointer',
            width: '100%',
          }}
        >
          <span style={{
            fontSize: '0.88rem',
            fontWeight: 600,
            color: showDefault ? '#fff' : 'var(--text-sub)',
          }}>
            기본 제공 {label}
          </span>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: showDefault ? '#fff' : 'var(--text-sub)',
            background: showDefault ? 'rgba(255,255,255,0.2)' : 'var(--bg)',
            borderRadius: '20px',
            padding: '2px 10px',
            border: `1px solid ${showDefault ? 'rgba(255,255,255,0.4)' : 'var(--border)'}`,
          }}>
            {showDefault ? 'ON' : 'OFF'}
          </span>
        </button>

        {/* ③ 개인 단어 섹션 */}
        <div>
          <div
            style={sectionHeaderStyle}
            onClick={() => setPersonalOpen(v => !v)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1rem' }}>👤</span>
              <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                개인 {label}
              </span>
              <span style={{
                fontSize: '0.75rem',
                color: 'var(--text-sub)',
                background: 'var(--bg)',
                borderRadius: '10px',
                padding: '1px 8px',
                border: '1px solid var(--border)',
              }}>
                {personalSets.length}개 세트
              </span>
            </div>
            <span style={{
              fontSize: '1rem',
              color: 'var(--text-sub)',
              transform: personalOpen ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              display: 'inline-block',
            }}>›</span>
          </div>

          {personalOpen && (
            <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {personalSets.length === 0 ? (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--text-sub)',
                  fontSize: '0.85rem',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  border: '1px dashed var(--border)',
                }}>
                  아직 개인 {label}가 없습니다.<br />
                  <span style={{ fontSize: '0.8rem' }}>홈에서 개인 {label} 관리를 눌러 추가하세요.</span>
                </div>
              ) : (
                personalSets.map(set => renderSetCard(set))
              )}
            </div>
          )}
        </div>

        {/* ④ 기본 제공 단어 섹션 (토글 ON일 때만 표시) */}
        {showDefault && (
          <div>
            <div
              style={sectionHeaderStyle}
              onClick={() => setDefaultOpen(v => !v)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1rem' }}>📚</span>
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>
                  기본 제공 {label}
                </span>
                <span style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-sub)',
                  background: 'var(--bg)',
                  borderRadius: '10px',
                  padding: '1px 8px',
                  border: '1px solid var(--border)',
                }}>
                  {defaultSets.length}개 세트
                </span>
              </div>
              <span style={{
                fontSize: '1rem',
                color: 'var(--text-sub)',
                transform: defaultOpen ? 'rotate(90deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s',
                display: 'inline-block',
              }}>›</span>
            </div>

            {defaultOpen && (
              <div style={{ paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {defaultSets.length === 0 ? (
                  <div style={{
                    padding: '20px',
                    textAlign: 'center',
                    color: 'var(--text-sub)',
                    fontSize: '0.85rem',
                    background: 'var(--bg)',
                    borderRadius: '10px',
                  }}>
                    기본 제공 {label}가 없습니다.
                  </div>
                ) : (
                  defaultSets.map(set => renderSetCard(set))
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 릴레이 플레이어 모달 */}
      {relaySet && (
        <RelayPlayerModal
          words={relayWords}
          setName={relaySet.name}
          onClose={() => { setRelaySet(null); setRelayWords([]) }}
        />
      )}
    </div>
  )
}
