'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { WordSet, DialogLine, DialogVocab, DialogExpression } from '@/types'
import { createClient } from '@/lib/supabase/client'
import {
  createSet, renameSet, deleteSet, swapSetOrder,
  addDialogLines, updateDialogLine, deleteDialogLine,
  addDialogVocab, updateDialogVocab, deleteDialogVocab,
  addDialogExpressions, updateDialogExpression, deleteDialogExpression,
} from '@/app/admin/actions'

interface DialogAdminPanelProps {
  dialogSets: WordSet[]
}

interface DialogSetContent {
  lines: DialogLine[]
  vocab: DialogVocab[]
  expressions: DialogExpression[]
}

type SubSection = 'lines' | 'vocab' | 'expressions'

const SUB_LABELS: Record<SubSection, string> = {
  lines: '대화 라인',
  vocab: '주요 단어',
  expressions: '주요 표현',
}

// CSV 포맷 안내
const CSV_HINTS: Record<SubSection, string> = {
  lines: 'A,日本語,ひらがな,한국어\nB,日本語,ひらがな,한국어',
  vocab: '日本語,ひらがな,한국어',
  expressions: '日本語,ひらがな,한국어',
}

function chipBtn(variant: 'green' | 'red' | 'gray' | 'default'): React.CSSProperties {
  const map = {
    green:   { bg: 'var(--primary)',    color: '#fff',           border: 'var(--primary)' },
    red:     { bg: '#fff5f5',           color: '#e53e3e',         border: '#fed7d7' },
    gray:    { bg: 'var(--bg)',         color: 'var(--text-sub)', border: 'var(--border)' },
    default: { bg: 'var(--btn-bg)',     color: 'var(--primary)',  border: 'var(--primary-light)' },
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

const iconBtn: React.CSSProperties = {
  width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  background: 'none', border: '1px solid var(--border)',
  borderRadius: '6px', cursor: 'pointer',
  fontSize: '0.85rem', color: 'var(--primary)', flexShrink: 0,
}

function orderBtnStyle(disabled: boolean): React.CSSProperties {
  return {
    width: '24px', height: '20px',
    border: '1px solid var(--border)', borderRadius: '4px',
    background: 'var(--bg)',
    color: disabled ? 'var(--border)' : 'var(--primary)',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.6rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  }
}

export default function DialogAdminPanel({ dialogSets }: DialogAdminPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // 세트 상태
  const [editingSetId, setEditingSetId] = useState<string | null>(null)
  const [editingSetName, setEditingSetName] = useState('')
  const [showAddSet, setShowAddSet] = useState(false)
  const [newSetName, setNewSetName] = useState('')

  // 펼쳐진 세트 → 콘텐츠
  const [expanded, setExpanded] = useState<Record<string, DialogSetContent | 'loading'>>({})
  // 활성 서브섹션
  const [activeSubSection, setActiveSubSection] = useState<Record<string, SubSection>>({})
  // CSV 입력
  const [csvText, setCsvText] = useState<Record<string, string>>({}) // key: `${setId}_${subSection}`
  const [csvResult, setCsvResult] = useState<Record<string, string>>({})

  // 라인 인라인 수정
  const [editingLineId, setEditingLineId] = useState<string | null>(null)
  const [editingLine, setEditingLine] = useState<{ speaker: 'A' | 'B'; jp: string; hira: string; ko: string }>({ speaker: 'A', jp: '', hira: '', ko: '' })

  // vocab/expression 인라인 수정
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<{ jp: string; hira: string; ko: string }>({ jp: '', hira: '', ko: '' })

  const fetchContent = async (setId: string): Promise<DialogSetContent> => {
    const supabase = createClient()
    const [linesRes, vocabRes, exprRes] = await Promise.all([
      supabase.from('dialog_lines').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
      supabase.from('dialog_vocab').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
      supabase.from('dialog_expressions').select('*').eq('set_id', setId).order('sort_order', { ascending: true }).limit(10000),
    ])
    return {
      lines: linesRes.data ?? [],
      vocab: vocabRes.data ?? [],
      expressions: exprRes.data ?? [],
    }
  }

  const toggleExpand = async (setId: string) => {
    if (expanded[setId] !== undefined) {
      setExpanded(prev => { const n = { ...prev }; delete n[setId]; return n })
      return
    }
    setExpanded(prev => ({ ...prev, [setId]: 'loading' }))
    const content = await fetchContent(setId)
    setExpanded(prev => ({ ...prev, [setId]: content }))
    setActiveSubSection(prev => ({ ...prev, [setId]: prev[setId] ?? 'lines' }))
  }

  const reloadContent = async (setId: string) => {
    const content = await fetchContent(setId)
    setExpanded(prev => ({ ...prev, [setId]: content }))
  }

  // ── CSV 파싱 ──────────────────────────────────────────────────────────────
  const parseLinesCsv = (text: string) => {
    const valid: { speaker: 'A' | 'B'; jp: string; hira: string; ko: string }[] = []
    let invalid = 0
    for (const raw of text.split('\n').map(l => l.trim()).filter(Boolean)) {
      const parts = raw.split(/,|\t/).map(p => p.trim())
      if (parts.length !== 4) { invalid++; continue }
      const [sp, jp, hira, ko] = parts
      if ((sp !== 'A' && sp !== 'B') || !jp || !hira || !ko) { invalid++; continue }
      valid.push({ speaker: sp as 'A' | 'B', jp, hira, ko })
    }
    return { valid, invalid }
  }

  const parseItemsCsv = (text: string) => {
    const valid: { jp: string; hira: string; ko: string }[] = []
    let invalid = 0
    for (const raw of text.split('\n').map(l => l.trim()).filter(Boolean)) {
      const parts = raw.split(/,|\t/).map(p => p.trim())
      if (parts.length !== 3 || parts.some(p => !p)) { invalid++; continue }
      const [jp, hira, ko] = parts
      valid.push({ jp, hira, ko })
    }
    return { valid, invalid }
  }

  const csvKey = (setId: string, sub: SubSection) => `${setId}_${sub}`

  const handleCsvAdd = (setId: string, sub: SubSection) => {
    const text = csvText[csvKey(setId, sub)] ?? ''
    startTransition(async () => {
      let added = 0
      let errMsg = ''
      if (sub === 'lines') {
        const { valid, invalid } = parseLinesCsv(text)
        if (valid.length === 0) {
          setCsvResult(prev => ({ ...prev, [csvKey(setId, sub)]: `추가할 항목이 없습니다. (형식오류 ${invalid}개)` }))
          return
        }
        const res = await addDialogLines(setId, valid)
        if ('error' in res) errMsg = res.error ?? ''
        else added = valid.length
      } else if (sub === 'vocab') {
        const { valid, invalid } = parseItemsCsv(text)
        if (valid.length === 0) {
          setCsvResult(prev => ({ ...prev, [csvKey(setId, sub)]: `추가할 항목이 없습니다. (형식오류 ${invalid}개)` }))
          return
        }
        const res = await addDialogVocab(setId, valid)
        if ('error' in res) errMsg = res.error ?? ''
        else added = valid.length
      } else {
        const { valid, invalid } = parseItemsCsv(text)
        if (valid.length === 0) {
          setCsvResult(prev => ({ ...prev, [csvKey(setId, sub)]: `추가할 항목이 없습니다. (형식오류 ${invalid}개)` }))
          return
        }
        const res = await addDialogExpressions(setId, valid)
        if ('error' in res) errMsg = res.error ?? ''
        else added = valid.length
      }

      if (errMsg) {
        setCsvResult(prev => ({ ...prev, [csvKey(setId, sub)]: `오류: ${errMsg}` }))
        return
      }
      await reloadContent(setId)
      setCsvText(prev => ({ ...prev, [csvKey(setId, sub)]: '' }))
      setCsvResult(prev => ({ ...prev, [csvKey(setId, sub)]: `${added}개 추가됨` }))
      router.refresh()
    })
  }

  // ── 세트 관리 ─────────────────────────────────────────────────────────────
  const handleRenameSave = (setId: string) => {
    if (!editingSetName.trim()) return
    startTransition(async () => {
      await renameSet(setId, editingSetName.trim())
      setEditingSetId(null)
      router.refresh()
    })
  }

  const handleDeleteSet = (set: WordSet) => {
    if (!confirm(`"${set.name}" 세트를 삭제하시겠습니까?\n포함된 모든 대화 내용도 함께 삭제됩니다.`)) return
    startTransition(async () => {
      await deleteSet(set.id)
      setExpanded(prev => { const n = { ...prev }; delete n[set.id]; return n })
      router.refresh()
    })
  }

  const handleSwap = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= dialogSets.length) return
    const a = dialogSets[idx]
    const b = dialogSets[targetIdx]
    startTransition(async () => {
      await swapSetOrder(a.id, a.sort_order, b.id, b.sort_order)
      router.refresh()
    })
  }

  const handleCreateSet = () => {
    if (!newSetName.trim()) return
    startTransition(async () => {
      await createSet(newSetName.trim(), 'dialog')
      setNewSetName('')
      setShowAddSet(false)
      router.refresh()
    })
  }

  // ── 라인 삭제/수정 ────────────────────────────────────────────────────────
  const handleDeleteLine = (setId: string, lineId: string) => {
    if (!confirm('이 라인을 삭제하시겠습니까?')) return
    startTransition(async () => {
      await deleteDialogLine(lineId)
      await reloadContent(setId)
      router.refresh()
    })
  }

  const handleSaveLine = (setId: string) => {
    if (!editingLineId) return
    startTransition(async () => {
      await updateDialogLine(editingLineId, editingLine.speaker, editingLine.jp, editingLine.hira, editingLine.ko)
      setEditingLineId(null)
      await reloadContent(setId)
    })
  }

  // ── vocab/expression 삭제/수정 ────────────────────────────────────────────
  const handleDeleteItem = (setId: string, id: string, sub: SubSection) => {
    if (!confirm('삭제하시겠습니까?')) return
    startTransition(async () => {
      if (sub === 'vocab') await deleteDialogVocab(id)
      else await deleteDialogExpression(id)
      await reloadContent(setId)
      router.refresh()
    })
  }

  const handleSaveItem = (setId: string, sub: SubSection) => {
    if (!editingItemId) return
    startTransition(async () => {
      if (sub === 'vocab') await updateDialogVocab(editingItemId, editingItem.jp, editingItem.hira, editingItem.ko)
      else await updateDialogExpression(editingItemId, editingItem.jp, editingItem.hira, editingItem.ko)
      setEditingItemId(null)
      await reloadContent(setId)
    })
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, minWidth: '70px',
    padding: '7px 9px',
    border: '1.5px solid var(--border)',
    borderRadius: '7px',
    fontSize: '0.85rem',
    outline: 'none',
    color: 'var(--text)',
    background: '#fff',
  }

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', overflowY: 'auto' }}>

      {dialogSets.length === 0 && !showAddSet && (
        <p style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-sub)', fontSize: '0.9rem' }}>
          대화 세트가 없습니다.
        </p>
      )}

      {dialogSets.map((set, idx) => {
        const isEditingName = editingSetId === set.id
        const expandedValue = expanded[set.id]
        const isExpanded = expandedValue !== undefined
        const isLoading = expandedValue === 'loading'
        const content = typeof expandedValue === 'object' ? expandedValue as DialogSetContent : null
        const sub = activeSubSection[set.id] ?? 'lines'

        return (
          <div key={set.id} style={{
            background: 'var(--card-bg)',
            borderRadius: '14px',
            boxShadow: '0 2px 12px var(--shadow)',
            overflow: 'hidden',
            border: isEditingName ? '1.5px solid var(--primary)' : '1.5px solid transparent',
          }}>
            {/* 세트 헤더 */}
            <div style={{ display: 'flex', alignItems: 'center', padding: '12px 14px', gap: '8px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
                <button onClick={() => handleSwap(idx, 'up')} disabled={idx === 0 || isPending} style={orderBtnStyle(idx === 0)}>▲</button>
                <button onClick={() => handleSwap(idx, 'down')} disabled={idx === dialogSets.length - 1 || isPending} style={orderBtnStyle(idx === dialogSets.length - 1)}>▼</button>
              </div>

              {isEditingName ? (
                <input
                  value={editingSetName}
                  onChange={e => setEditingSetName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleRenameSave(set.id)
                    if (e.key === 'Escape') setEditingSetId(null)
                  }}
                  autoFocus
                  style={{ flex: 1, padding: '6px 10px', border: '1.5px solid var(--primary)', borderRadius: '8px', fontSize: '1rem', fontWeight: 600, outline: 'none', color: 'var(--text)' }}
                />
              ) : (
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{set.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>{set.line_count ?? 0}줄 대화</div>
                </div>
              )}

              {isEditingName ? (
                <>
                  <button onClick={() => handleRenameSave(set.id)} disabled={isPending} style={chipBtn('green')}>저장</button>
                  <button onClick={() => setEditingSetId(null)} style={chipBtn('gray')}>취소</button>
                </>
              ) : (
                <>
                  <button onClick={() => toggleExpand(set.id)} style={chipBtn(isExpanded ? 'green' : 'default')}>
                    {isExpanded ? '접기' : '관리'}
                  </button>
                  <button onClick={() => { setEditingSetId(set.id); setEditingSetName(set.name) }} style={chipBtn('default')}>이름</button>
                  <button onClick={() => handleDeleteSet(set)} style={chipBtn('red')}>삭제</button>
                </>
              )}
            </div>

            {/* 콘텐츠 패널 */}
            {isExpanded && (
              <div style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}>
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-sub)', fontSize: '0.85rem' }}>로딩 중...</div>
                ) : (
                  <>
                    {/* 서브섹션 탭 */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
                      {(['lines', 'vocab', 'expressions'] as SubSection[]).map(s => (
                        <button
                          key={s}
                          onClick={() => setActiveSubSection(prev => ({ ...prev, [set.id]: s }))}
                          style={{
                            flex: 1, padding: '9px 4px',
                            background: 'none', border: 'none',
                            borderBottom: sub === s ? '2px solid var(--primary)' : '2px solid transparent',
                            marginBottom: '-1px',
                            fontSize: '0.75rem',
                            fontWeight: sub === s ? 700 : 400,
                            color: sub === s ? 'var(--primary)' : 'var(--text-sub)',
                            cursor: 'pointer',
                          }}
                        >
                          {SUB_LABELS[s]}
                          {content && (
                            <span style={{ marginLeft: '4px', fontSize: '0.65rem', opacity: 0.7 }}>
                              ({content[s].length})
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div style={{ padding: '12px 14px' }}>
                      {/* CSV 안내 + 입력 */}
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '6px', lineHeight: 1.6 }}>
                        {sub === 'lines' ? (
                          <>한 줄에 하나씩 <b>발화자(A/B),일본어,히라가나,한국어</b> 형식으로 입력</>
                        ) : (
                          <>한 줄에 하나씩 <b>일본어,히라가나,한국어</b> 형식으로 입력</>
                        )}
                      </div>
                      <textarea
                        value={csvText[csvKey(set.id, sub)] ?? ''}
                        onChange={e => setCsvText(prev => ({ ...prev, [csvKey(set.id, sub)]: e.target.value }))}
                        placeholder={CSV_HINTS[sub]}
                        rows={4}
                        style={{
                          width: '100%', boxSizing: 'border-box',
                          padding: '8px 10px',
                          border: '1.5px solid var(--border)',
                          borderRadius: '7px',
                          fontSize: '0.8rem',
                          fontFamily: 'monospace',
                          resize: 'vertical',
                          outline: 'none',
                          color: 'var(--text)',
                          background: '#fff',
                          lineHeight: 1.6,
                          marginBottom: '6px',
                        }}
                      />
                      <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                        <button
                          onClick={() => handleCsvAdd(set.id, sub)}
                          disabled={isPending || !(csvText[csvKey(set.id, sub)] ?? '').trim()}
                          style={{
                            padding: '7px 16px', background: 'var(--primary)', color: '#fff',
                            border: 'none', borderRadius: '7px', fontSize: '0.82rem',
                            fontWeight: 700, cursor: 'pointer',
                            opacity: (csvText[csvKey(set.id, sub)] ?? '').trim() ? 1 : 0.4,
                          }}
                        >일괄 추가</button>
                        {csvText[csvKey(set.id, sub)] && (
                          <button
                            onClick={() => setCsvText(prev => ({ ...prev, [csvKey(set.id, sub)]: '' }))}
                            style={{ padding: '7px 12px', background: 'transparent', color: 'var(--text-sub)', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '0.82rem', cursor: 'pointer' }}
                          >지우기</button>
                        )}
                      </div>
                      {csvResult[csvKey(set.id, sub)] && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginBottom: '8px', fontWeight: 600 }}>
                          {csvResult[csvKey(set.id, sub)]}
                        </div>
                      )}

                      {/* 목록 */}
                      {content && content[sub].length > 0 && (
                        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                          {sub === 'lines' && (content.lines as DialogLine[]).map(line => (
                            <div key={line.id}>
                              {editingLineId === line.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', padding: '8px', background: 'var(--card-bg)', borderRadius: '9px', border: '1.5px solid var(--primary)' }}>
                                  <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                    <select
                                      value={editingLine.speaker}
                                      onChange={e => setEditingLine(p => ({ ...p, speaker: e.target.value as 'A' | 'B' }))}
                                      style={{ padding: '7px 9px', border: '1.5px solid var(--border)', borderRadius: '7px', fontSize: '0.85rem', outline: 'none', color: 'var(--text)', background: '#fff', width: '60px' }}
                                    >
                                      <option value="A">A</option>
                                      <option value="B">B</option>
                                    </select>
                                    <input value={editingLine.jp} onChange={e => setEditingLine(p => ({ ...p, jp: e.target.value }))} placeholder="일본어" style={inputStyle} />
                                  </div>
                                  <input value={editingLine.hira} onChange={e => setEditingLine(p => ({ ...p, hira: e.target.value }))} placeholder="히라가나" style={{ ...inputStyle, minWidth: 'unset', width: '100%', boxSizing: 'border-box' }} />
                                  <input value={editingLine.ko} onChange={e => setEditingLine(p => ({ ...p, ko: e.target.value }))} placeholder="한국어" style={{ ...inputStyle, minWidth: 'unset', width: '100%', boxSizing: 'border-box' }} />
                                  <div style={{ display: 'flex', gap: '5px' }}>
                                    <button onClick={() => handleSaveLine(set.id)} disabled={isPending} style={chipBtn('green')}>저장</button>
                                    <button onClick={() => setEditingLineId(null)} style={chipBtn('gray')}>취소</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '7px 10px', background: 'var(--card-bg)', borderRadius: '9px', border: '1px solid var(--border)' }}>
                                  <span style={{
                                    flexShrink: 0,
                                    padding: '2px 8px', borderRadius: '10px',
                                    background: line.speaker === 'A' ? '#e8f5ff' : '#f0fff4',
                                    color: line.speaker === 'A' ? '#1a6fb5' : '#276749',
                                    fontSize: '0.75rem', fontWeight: 700,
                                  }}>{line.speaker}</span>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{line.jp}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--primary)', marginTop: '1px' }}>{line.hira}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: '1px' }}>{line.ko}</div>
                                  </div>
                                  <button onClick={() => { setEditingLineId(line.id); setEditingLine({ speaker: line.speaker, jp: line.jp, hira: line.hira, ko: line.ko }) }} title="수정" style={iconBtn}>✎</button>
                                  <button onClick={() => handleDeleteLine(set.id, line.id)} title="삭제" style={{ ...iconBtn, color: '#e53e3e' }}>✕</button>
                                </div>
                              )}
                            </div>
                          ))}

                          {(sub === 'vocab' || sub === 'expressions') && (content[sub] as (DialogVocab | DialogExpression)[]).map(item => (
                            <div key={item.id}>
                              {editingItemId === item.id ? (
                                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', padding: '8px', background: 'var(--card-bg)', borderRadius: '9px', border: '1.5px solid var(--primary)' }}>
                                  <input value={editingItem.jp} onChange={e => setEditingItem(p => ({ ...p, jp: e.target.value }))} placeholder="일본어" style={inputStyle} />
                                  <input value={editingItem.hira} onChange={e => setEditingItem(p => ({ ...p, hira: e.target.value }))} placeholder="히라가나" style={inputStyle} />
                                  <input value={editingItem.ko} onChange={e => setEditingItem(p => ({ ...p, ko: e.target.value }))} placeholder="한국어" style={inputStyle} />
                                  <div style={{ display: 'flex', gap: '5px', width: '100%' }}>
                                    <button onClick={() => handleSaveItem(set.id, sub)} disabled={isPending} style={chipBtn('green')}>저장</button>
                                    <button onClick={() => setEditingItemId(null)} style={chipBtn('gray')}>취소</button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 10px', background: 'var(--card-bg)', borderRadius: '9px', border: '1px solid var(--border)' }}>
                                  <div style={{ flex: 1, display: 'flex', gap: '8px', flexWrap: 'wrap', minWidth: 0 }}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)' }}>{item.jp}</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>{item.hira}</span>
                                    <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>{item.ko}</span>
                                  </div>
                                  <button onClick={() => { setEditingItemId(item.id); setEditingItem({ jp: item.jp, hira: item.hira, ko: item.ko }) }} title="수정" style={iconBtn}>✎</button>
                                  <button onClick={() => handleDeleteItem(set.id, item.id, sub)} title="삭제" style={{ ...iconBtn, color: '#e53e3e' }}>✕</button>
                                </div>
                              )}
                            </div>
                          ))}
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
        <div style={{ background: 'var(--card-bg)', borderRadius: '14px', boxShadow: '0 2px 12px var(--shadow)', padding: '16px', border: '1.5px solid var(--primary)' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-sub)', marginBottom: '10px' }}>새 대화 세트 추가</div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              value={newSetName}
              onChange={e => setNewSetName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateSet() }}
              placeholder="세트 이름"
              autoFocus
              style={{ flex: 1, padding: '9px 12px', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', color: 'var(--text)' }}
            />
            <button onClick={handleCreateSet} disabled={isPending || !newSetName.trim()} style={{ padding: '9px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '8px', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', opacity: !newSetName.trim() ? 0.5 : 1 }}>추가</button>
            <button onClick={() => { setShowAddSet(false); setNewSetName('') }} style={{ padding: '9px 12px', background: 'var(--bg)', color: 'var(--text-sub)', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.9rem', cursor: 'pointer' }}>취소</button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSet(true)}
          style={{ width: '100%', padding: '14px', background: 'var(--card-bg)', color: 'var(--primary)', border: '2px dashed var(--primary-light)', borderRadius: '14px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
        >
          + 새 대화 세트 추가
        </button>
      )}

      <div style={{ height: '16px' }} />
    </div>
  )
}
