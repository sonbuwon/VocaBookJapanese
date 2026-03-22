'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { WordSet, Word, StudyType } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  createSet,
  renameSet,
  deleteSet,
  swapSetOrder,
  addWord,
  updateWord,
  deleteWord,
} from '@/app/admin/actions'

interface AdminViewProps {
  wordSets: WordSet[]
  sentSets: WordSet[]
}

type WordForm = { jp: string; hira: string; ko: string }

export default function AdminView({ wordSets, sentSets }: AdminViewProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<StudyType>('word')

  // 펼쳐진 세트: setId → Word[] | 'loading'
  const [expanded, setExpanded] = useState<Record<string, Word[] | 'loading'>>({})

  // 세트 이름 인라인 수정
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingSetName, setEditingSetName] = useState('')

  // 새 세트 추가 폼
  const [showAddSet, setShowAddSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')

  // 단어 추가 폼: setId → {jp, hira, ko}
  const [addWordData, setAddWordData] = useState<Record<string, WordForm>>({})

  // 단어 인라인 수정
  const [editingWordId, setEditingWordId] = useState<string | null>(null)
  const [editingWordData, setEditingWordData] = useState<WordForm>({ jp: '', hira: '', ko: '' })

  const sets = tab === 'word' ? wordSets : sentSets
  const label = tab === 'word' ? '단어' : '문장'

  // --- 단어 로드 ---
  const toggleExpand = async (setId: string) => {
    if (expanded[setId] !== undefined) {
      setExpanded(prev => { const n = { ...prev }; delete n[setId]; return n })
      return
    }
    setExpanded(prev => ({ ...prev, [setId]: 'loading' }))
    const words = await fetchWords(setId)
    setExpanded(prev => ({ ...prev, [setId]: words }))
  }

  const fetchWords = async (setId: string): Promise<Word[]> => {
    const supabase = createClient()
    const { data } = await supabase
      .from('words')
      .select('*')
      .eq('set_id', setId)
      .order('sort_order', { ascending: true })
    return data ?? []
  }

  const reloadWords = async (setId: string) => {
    const words = await fetchWords(setId)
    setExpanded(prev => ({ ...prev, [setId]: words }))
  }

  // --- 세트 조작 ---
  const handleRenameStart = (set: WordSet) => {
    setEditingSetId(set.id)
    setEditingSetName(set.name)
  }

  const handleRenameSave = (setId: string) => {
    if (!editingSetName.trim()) return
    startTransition(async () => {
      await renameSet(setId, editingSetName.trim())
      setEditingSetId(null)
      router.refresh()
    })
  }

  const handleDeleteSet = (set: WordSet) => {
    if (!confirm(`"${set.name}" 세트를 삭제하시겠습니까?\n포함된 모든 ${label}도 함께 삭제됩니다.`)) return
    startTransition(async () => {
      await deleteSet(set.id)
      setExpanded(prev => { const n = { ...prev }; delete n[set.id]; return n })
      router.refresh()
    })
  }

  const handleSwap = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sets.length) return
    const a = sets[idx]
    const b = sets[targetIdx]
    startTransition(async () => {
      await swapSetOrder(a.id, a.sort_order, b.id, b.sort_order)
      router.refresh()
    })
  }

  const handleCreateSet = () => {
    if (!newSetName.trim()) return
    startTransition(async () => {
      await createSet(newSetName.trim(), tab)
      setNewSetName('')
      setShowAddSet(false)
      router.refresh()
    })
  }

  // --- 단어 조작 ---
  const updateWordForm = (setId: string, field: keyof WordForm, value: string) => {
    setAddWordData(prev => ({
      ...prev,
      [setId]: { ...(prev[setId] ?? { jp: '', hira: '', ko: '' }), [field]: value },
    }))
  }

  const handleAddWord = (setId: string) => {
    const form = addWordData[setId]
    if (!form?.jp?.trim() || !form?.hira?.trim() || !form?.ko?.trim()) return
    startTransition(async () => {
      await addWord(setId, form.jp, form.hira, form.ko)
      await reloadWords(setId)
      setAddWordData(prev => ({ ...prev, [setId]: { jp: '', hira: '', ko: '' } }))
      router.refresh()
    })
  }

  const handleEditWordStart = (word: Word) => {
    setEditingWordId(word.id)
    setEditingWordData({ jp: word.jp, hira: word.hira, ko: word.ko })
  }

  const handleEditWordSave = (setId: string, wordId: string) => {
    if (!editingWordData.jp.trim()) return
    startTransition(async () => {
      await updateWord(wordId, editingWordData.jp, editingWordData.hira, editingWordData.ko)
      setEditingWordId(null)
      await reloadWords(setId)
    })
  }

  const handleDeleteWord = (setId: string, wordId: string) => {
    if (!confirm('이 단어를 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteWord(wordId)
      await reloadWords(setId)
      router.refresh()
    })
  }

  return (
    <div style={{ width: '100%', maxWidth: '480px', minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>

      {/* 헤더 */}
      <header style={{
        background: 'var(--primary)',
        color: '#fff',
        padding: '18px 16px 14px',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        flexShrink: 0,
      }}>
        <a
          href="/"
          style={{
            position: 'absolute', left: '14px',
            color: '#fff', textDecoration: 'none',
            fontSize: '1.5rem', lineHeight: 1,
            padding: '4px 6px', borderRadius: '6px',
          }}
        >←</a>
        <h1 style={{ flex: 1, textAlign: 'center', fontSize: '1.15rem', fontWeight: 700, letterSpacing: '0.04em' }}>
          단어 관리
        </h1>
      </header>

      {/* 탭 */}
      <div style={{ display: 'flex', background: 'var(--card-bg)', borderBottom: '2px solid var(--border)', flexShrink: 0 }}>
        {(['word', 'sent'] as StudyType[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              marginBottom: '-2px',
              fontSize: '0.95rem',
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? 'var(--primary)' : 'var(--text-sub)',
              cursor: 'pointer',
            }}
          >
            {t === 'word' ? '단어 세트' : '문장 세트'}
          </button>
        ))}
      </div>

      {/* 세트 목록 */}
      <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>

        {sets.length === 0 && (
          <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
            {label} 세트가 없습니다.
          </p>
        )}

        {sets.map((set, idx) => {
          const isEditingName = editingSetId === set.id
          const expandedValue = expanded[set.id]
          const isExpanded = expandedValue !== undefined
          const isLoadingWords = expandedValue === 'loading'
          const wordList = Array.isArray(expandedValue) ? expandedValue as Word[] : []
          const wordForm = addWordData[set.id] ?? { jp: '', hira: '', ko: '' }
          const canAddWord = wordForm.jp.trim() && wordForm.hira.trim() && wordForm.ko.trim()

          return (
            <div key={set.id} style={{
              background: 'var(--card-bg)',
              borderRadius: '14px',
              boxShadow: '0 2px 12px var(--shadow)',
              overflow: 'hidden',
              border: isEditingName ? '1.5px solid var(--primary)' : '1.5px solid transparent',
              transition: 'border-color 0.15s',
            }}>
              {/* 세트 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '8px' }}>

                {/* 순서 버튼 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                  <button
                    onClick={() => handleSwap(idx, 'up')}
                    disabled={idx === 0 || isPending}
                    title="위로"
                    style={orderBtnStyle(idx === 0)}
                  >▲</button>
                  <button
                    onClick={() => handleSwap(idx, 'down')}
                    disabled={idx === sets.length - 1 || isPending}
                    title="아래로"
                    style={orderBtnStyle(idx === sets.length - 1)}
                  >▼</button>
                </div>

                {/* 세트 이름 */}
                {isEditingName ? (
                  <input
                    value={editingSetName}
                    onChange={e => setEditingSetName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleRenameSave(set.id)
                      if (e.key === 'Escape') setEditingSetId(null)
                    }}
                    autoFocus
                    style={{
                      flex: 1,
                      padding: '6px 10px',
                      border: '1.5px solid var(--primary)',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      fontWeight: 600,
                      outline: 'none',
                      color: 'var(--text)',
                    }}
                  />
                ) : (
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {set.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                      {set.word_count ?? 0}개 {label}
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                {isEditingName ? (
                  <>
                    <button onClick={() => handleRenameSave(set.id)} disabled={isPending} style={chipBtn('green')}>저장</button>
                    <button onClick={() => setEditingSetId(null)} style={chipBtn('gray')}>취소</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => toggleExpand(set.id)} style={chipBtn(isExpanded ? 'green' : 'default')}>
                      {isExpanded ? '접기' : label + ' 관리'}
                    </button>
                    <button onClick={() => handleRenameStart(set)} style={chipBtn('default')}>이름</button>
                    <button onClick={() => handleDeleteSet(set)} style={chipBtn('red')}>삭제</button>
                  </>
                )}
              </div>

              {/* 단어 패널 */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px', background: 'var(--bg)' }}>
                  {isLoadingWords ? (
                    <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-sub)', fontSize: '0.85rem' }}>로딩 중...</div>
                  ) : (
                    <>
                      {/* 단어 목록 */}
                      {wordList.length === 0 ? (
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-sub)', textAlign: 'center', padding: '8px 0 12px' }}>
                          {label}이 없습니다. 아래에서 추가하세요.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '12px' }}>
                          {wordList.map(word => (
                            <div key={word.id}>
                              {editingWordId === word.id ? (
                                <div style={{
                                  display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'center',
                                  padding: '8px', background: 'var(--card-bg)', borderRadius: '9px',
                                  border: '1.5px solid var(--primary)',
                                }}>
                                  <input
                                    value={editingWordData.jp}
                                    onChange={e => setEditingWordData(p => ({ ...p, jp: e.target.value }))}
                                    placeholder="일본어"
                                    style={wordInputStyle}
                                  />
                                  <input
                                    value={editingWordData.hira}
                                    onChange={e => setEditingWordData(p => ({ ...p, hira: e.target.value }))}
                                    placeholder="히라가나"
                                    style={wordInputStyle}
                                  />
                                  <input
                                    value={editingWordData.ko}
                                    onChange={e => setEditingWordData(p => ({ ...p, ko: e.target.value }))}
                                    placeholder="한국어"
                                    style={wordInputStyle}
                                  />
                                  <button onClick={() => handleEditWordSave(set.id, word.id)} disabled={isPending} style={chipBtn('green')}>저장</button>
                                  <button onClick={() => setEditingWordId(null)} style={chipBtn('gray')}>취소</button>
                                </div>
                              ) : (
                                <div style={{
                                  display: 'flex', alignItems: 'center', gap: '8px',
                                  padding: '7px 10px', background: 'var(--card-bg)', borderRadius: '9px',
                                  border: '1px solid var(--border)',
                                }}>
                                  <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{word.jp}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{word.hira}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>{word.ko}</span>
                                  </div>
                                  <button onClick={() => handleEditWordStart(word)} title="수정" style={iconBtn}>✎</button>
                                  <button onClick={() => handleDeleteWord(set.id, word.id)} title="삭제" style={{ ...iconBtn, color: '#e53e3e' }}>✕</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 단어/문장 추가 폼 */}
                      <div style={{
                        borderTop: wordList.length > 0 ? '1px solid var(--border)' : 'none',
                        paddingTop: wordList.length > 0 ? '10px' : '0',
                      }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '7px' }}>
                          새 {label} 추가
                        </div>
                        {tab === 'sent' ? (
                          /* 문장: 각 입력란을 한 줄씩 세로 배치 */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <input
                              value={wordForm.jp}
                              onChange={e => updateWordForm(set.id, 'jp', e.target.value)}
                              placeholder="일본어 문장"
                              style={sentInputStyle}
                            />
                            <input
                              value={wordForm.hira}
                              onChange={e => updateWordForm(set.id, 'hira', e.target.value)}
                              placeholder="히라가나"
                              style={sentInputStyle}
                            />
                            <input
                              value={wordForm.ko}
                              onChange={e => updateWordForm(set.id, 'ko', e.target.value)}
                              placeholder="한국어 번역"
                              onKeyDown={e => { if (e.key === 'Enter') handleAddWord(set.id) }}
                              style={sentInputStyle}
                            />
                            <button
                              onClick={() => handleAddWord(set.id)}
                              disabled={isPending || !canAddWord}
                              style={{
                                padding: '9px',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.88rem',
                                fontWeight: 700,
                                cursor: canAddWord ? 'pointer' : 'not-allowed',
                                opacity: canAddWord ? 1 : 0.4,
                              }}
                            >추가</button>
                          </div>
                        ) : (
                          /* 단어: 기존 가로 배치 */
                          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                            <input
                              value={wordForm.jp}
                              onChange={e => updateWordForm(set.id, 'jp', e.target.value)}
                              placeholder="일본어"
                              style={wordInputStyle}
                            />
                            <input
                              value={wordForm.hira}
                              onChange={e => updateWordForm(set.id, 'hira', e.target.value)}
                              placeholder="히라가나"
                              style={wordInputStyle}
                            />
                            <input
                              value={wordForm.ko}
                              onChange={e => updateWordForm(set.id, 'ko', e.target.value)}
                              placeholder="한국어"
                              onKeyDown={e => { if (e.key === 'Enter') handleAddWord(set.id) }}
                              style={wordInputStyle}
                            />
                            <button
                              onClick={() => handleAddWord(set.id)}
                              disabled={isPending || !canAddWord}
                              style={{
                                padding: '8px 14px',
                                background: 'var(--primary)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                                fontWeight: 700,
                                cursor: canAddWord ? 'pointer' : 'not-allowed',
                                opacity: canAddWord ? 1 : 0.4,
                                flexShrink: 0,
                              }}
                            >추가</button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}

        {/* 새 세트 추가 */}
        {showAddSet ? (
          <div style={{
            background: 'var(--card-bg)',
            borderRadius: '14px',
            boxShadow: '0 2px 12px var(--shadow)',
            padding: '16px',
            border: '1.5px solid var(--primary)',
          }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '10px' }}>
              새 {label} 세트 추가
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                value={newSetName}
                onChange={e => setNewSetName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreateSet() }}
                placeholder="세트 이름"
                autoFocus
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  outline: 'none',
                  color: 'var(--text)',
                }}
              />
              <button
                onClick={handleCreateSet}
                disabled={isPending || !newSetName.trim()}
                style={{
                  padding: '9px 16px',
                  background: 'var(--primary)', color: '#fff',
                  border: 'none', borderRadius: '8px',
                  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                  opacity: !newSetName.trim() ? 0.5 : 1,
                }}
              >추가</button>
              <button
                onClick={() => { setShowAddSet(false); setNewSetName('') }}
                style={{
                  padding: '9px 12px',
                  background: 'var(--bg)', color: 'var(--text-sub)',
                  border: '1.5px solid var(--border)', borderRadius: '8px',
                  fontSize: '0.9rem', cursor: 'pointer',
                }}
              >취소</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAddSet(true)}
            style={{
              width: '100%', padding: '14px',
              background: 'var(--card-bg)', color: 'var(--primary)',
              border: '2px dashed var(--primary-light)',
              borderRadius: '14px', fontSize: '0.95rem',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            + 새 {label} 세트 추가
          </button>
        )}

        <div style={{ height: '16px' }} />
      </div>
    </div>
  )
}

// --- 스타일 헬퍼 ---

function orderBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '24px', height: '20px',
    border: '1px solid var(--border)',
    borderRadius: '4px',
    background: 'var(--bg)',
    color: disabled ? 'var(--border)' : 'var(--primary)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }
}

function chipBtn(variant: 'green' | 'red' | 'gray' | 'default'): React.CSSProperties {
  const map = {
    green:   { bg: 'var(--primary)',    color: '#fff',               border: 'var(--primary)' },
    red:     { bg: '#fff5f5',           color: '#e53e3e',             border: '#fed7d7' },
    gray:    { bg: 'var(--bg)',         color: 'var(--text-sub)',     border: 'var(--border)' },
    default: { bg: 'var(--btn-bg)',     color: 'var(--primary)',      border: 'var(--primary-light)' },
  }
  const c = map[variant]
  return {
    padding: '5px 9px',
    background: c.bg, color: c.color,
    border: `1.5px solid ${c.border}`,
    borderRadius: '7px',
    fontSize: '0.76rem', fontWeight: 600,
    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
  }
}

const wordInputStyle: React.CSSProperties = {
  flex: 1,
  minWidth: '70px',
  padding: '7px 9px',
  border: '1.5px solid var(--border)',
  borderRadius: '7px',
  fontSize: '0.88rem',
  outline: 'none',
  color: 'var(--text)',
  background: '#fff',
}

const sentInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid var(--border)',
  borderRadius: '7px',
  fontSize: '0.9rem',
  outline: 'none',
  color: 'var(--text)',
  background: '#fff',
  boxSizing: 'border-box',
}

const iconBtn: React.CSSProperties = {
  width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none',
  border: '1px solid var(--border)',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '0.85rem',
  color: 'var(--primary)',
  flexShrink: 0,
}
