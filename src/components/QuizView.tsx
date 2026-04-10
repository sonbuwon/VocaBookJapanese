'use client'

import { useState, useEffect } from 'react'
import type { WordSet, Word } from '@/types'
import { getWords } from '@/lib/data-client'
import { shuffle } from '@/lib/utils'
import {
  saveQuizHistory,
  getQuizHistory,
  type QuizHistoryEntry,
  type QuizHistoryItem,
} from '@/lib/quiz-history-client'
import { getFavoriteWordIds, toggleFavorite } from '@/lib/favorites-client'

// ── 내부 타입 ────────────────────────────────────────────────────────────────
type QuizMode   = 'hira' | 'meaning'
type QuizOrder  = 'sequential' | 'random'
type QuizPhase  = 'config' | 'session' | 'result' | 'history-detail'

interface QuizQuestion {
  word: Word
  choices: string[]
  correctIndex: number
}

interface QuizResult {
  question: QuizQuestion
  selectedIndex: number
  isCorrect: boolean
}

// ── 가짜 히라가나 생성 ────────────────────────────────────────────────────────
const HIRA = 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽゃゅょっ'

function fakeHira(original: string): string {
  const chars = original.split('')
  let fake = original
  for (let attempt = 0; fake === original && attempt < 10; attempt++) {
    const next = [...chars]
    const changes = original.length >= 4 ? 2 : 1
    for (let i = 0; i < changes; i++) {
      next[Math.floor(Math.random() * next.length)] =
        HIRA[Math.floor(Math.random() * HIRA.length)]
    }
    fake = next.join('')
  }
  return fake
}

// ── 문제 생성 ────────────────────────────────────────────────────────────────
function buildQuestion(word: Word, pool: Word[], mode: QuizMode): QuizQuestion {
  const correct    = mode === 'hira' ? word.hira : word.ko
  const others     = shuffle(pool.filter(w => w.id !== word.id))
  const used       = new Set([correct])
  const distractors: string[] = []

  if (mode === 'hira') {
    for (let i = 0; i < 2 && distractors.length < 2; i++) {
      let attempts = 0
      let fake = fakeHira(word.hira)
      while (used.has(fake) && attempts++ < 10) fake = fakeHira(word.hira)
      if (!used.has(fake)) { used.add(fake); distractors.push(fake) }
    }
    for (const o of others) {
      if (distractors.length >= 3) break
      if (!used.has(o.hira)) { used.add(o.hira); distractors.push(o.hira) }
    }
  } else {
    for (const o of others) {
      if (distractors.length >= 3) break
      if (!used.has(o.ko)) { used.add(o.ko); distractors.push(o.ko) }
    }
  }

  const choices = shuffle([correct, ...distractors])
  return { word, choices, correctIndex: choices.indexOf(correct) }
}

// ── 날짜 포맷 ────────────────────────────────────────────────────────────────
function relativeDate(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return '오늘'
  if (diff === 1) return '어제'
  if (diff < 7)  return `${diff}일 전`
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function getGrade(pct: number) {
  if (pct >= 90) return { label: '완벽해요! 🎉',      color: '#276749' }
  if (pct >= 70) return { label: '잘 했어요! 👍',      color: '#2b6cb0' }
  if (pct >= 50) return { label: '조금 더 해봐요 💪',  color: '#b7791f' }
  return              { label: '다시 도전해봐요 🔥',   color: '#c53030' }
}

const LABELS = ['A', 'B', 'C', 'D']

// ── Props ────────────────────────────────────────────────────────────────────
interface QuizViewProps { wordSets: WordSet[] }

// ─────────────────────────────────────────────────────────────────────────────
export default function QuizView({ wordSets }: QuizViewProps) {
  // ── 설정 상태 ──────────────────────────────────────────────────────────────
  const [selectedSetId, setSelectedSetId] = useState(wordSets[0]?.id ?? '')
  const [mode,          setMode]          = useState<QuizMode>('hira')
  const [order,         setOrder]         = useState<QuizOrder>('sequential')
  const [countInput,    setCountInput]    = useState('10')
  const [isLoading,     setIsLoading]     = useState(false)
  const [loadError,     setLoadError]     = useState('')

  // ── 세션 상태 ──────────────────────────────────────────────────────────────
  const [phase,          setPhase]          = useState<QuizPhase>('config')
  const [questions,      setQuestions]      = useState<QuizQuestion[]>([])
  const [currentIdx,     setCurrentIdx]     = useState(0)
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null)
  const [results,        setResults]        = useState<QuizResult[]>([])

  // ── 저장/내역 상태 ─────────────────────────────────────────────────────────
  const [saveStatus,      setSaveStatus]      = useState<'prompt' | 'saving' | 'saved' | 'skipped'>('prompt')
  const [history,         setHistory]         = useState<QuizHistoryEntry[]>([])
  const [historyLoading,  setHistoryLoading]  = useState(false)
  const [detailEntry,     setDetailEntry]     = useState<QuizHistoryEntry | null>(null)
  const [detailFavIds,    setDetailFavIds]    = useState<Set<string>>(new Set())

  const selectedSet = wordSets.find(s => s.id === selectedSetId)
  const score       = results.filter(r => r.isCorrect).length

  // 마운트 시 내역 로드
  useEffect(() => {
    setHistoryLoading(true)
    getQuizHistory().then(h => { setHistory(h); setHistoryLoading(false) })
  }, [])

  // ── 퀴즈 시작 ─────────────────────────────────────────────────────────────
  const handleStart = async () => {
    setLoadError('')
    setIsLoading(true)
    try {
      let words = await getWords(selectedSetId)
      if (words.length < 2) {
        setLoadError('단어가 2개 이상인 세트를 선택해주세요.')
        return
      }
      if (order === 'random') {
        const count = Math.min(parseInt(countInput) || 10, words.length)
        words = shuffle(words).slice(0, count)
      }
      const pool = await getWords(selectedSetId)
      setQuestions(words.map(w => buildQuestion(w, pool, mode)))
      setCurrentIdx(0)
      setSelectedChoice(null)
      setResults([])
      setSaveStatus('prompt')
      setPhase('session')
    } catch {
      setLoadError('단어를 불러오는 데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  // ── 답 선택 ───────────────────────────────────────────────────────────────
  const handleSelect = (idx: number) => {
    if (selectedChoice !== null) return
    setSelectedChoice(idx)
    setResults(prev => [...prev, {
      question: questions[currentIdx],
      selectedIndex: idx,
      isCorrect: idx === questions[currentIdx].correctIndex,
    }])
  }

  // ── 다음 문제 ─────────────────────────────────────────────────────────────
  const handleNext = () => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('result')
    } else {
      setCurrentIdx(i => i + 1)
      setSelectedChoice(null)
    }
  }

  // ── 저장 ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaveStatus('saving')
    const items: QuizHistoryItem[] = results.map(r => ({
      word_id:       r.question.word.id,
      jp:            r.question.word.jp,
      hira:          r.question.word.hira,
      ko:            r.question.word.ko,
      choices:       r.question.choices,
      correctIndex:  r.question.correctIndex,
      selectedIndex: r.selectedIndex,
      isCorrect:     r.isCorrect,
    }))
    await saveQuizHistory({
      set_id:    selectedSetId,
      set_name:  selectedSet?.name ?? '',
      mode,
      score,
      total:     results.length,
      questions: items,
    })
    const updated = await getQuizHistory()
    setHistory(updated)
    setSaveStatus('saved')
  }

  // ── 내역 상세 열기 ────────────────────────────────────────────────────────
  const openDetail = async (entry: QuizHistoryEntry) => {
    setDetailEntry(entry)
    setDetailFavIds(new Set())
    setPhase('history-detail')
    const ids = entry.questions.map(q => q.word_id).filter(Boolean) as string[]
    if (ids.length > 0) {
      const favIds = await getFavoriteWordIds(ids)
      setDetailFavIds(new Set(favIds))
    }
  }

  // ── 즐겨찾기 토글 (내역 상세) ────────────────────────────────────────────
  const handleToggleDetailFav = async (wordId: string) => {
    const nowFav = await toggleFavorite(wordId)
    setDetailFavIds(prev => {
      const next = new Set(prev)
      if (nowFav) next.add(wordId)
      else next.delete(wordId)
      return next
    })
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 내역 상세 화면
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'history-detail' && detailEntry) {
    const pct   = Math.round((detailEntry.score / detailEntry.total) * 100)
    const grade = getGrade(pct)

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', overflowY: 'auto' }}>
        {/* 상단 요약 */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: '14px',
          padding: '16px', boxShadow: '0 2px 10px var(--shadow)',
          display: 'flex', alignItems: 'center', gap: '14px',
        }}>
          <button
            onClick={() => setPhase('config')}
            style={{ padding: '6px 12px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-sub)', flexShrink: 0 }}
          >← 목록</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {detailEntry.set_name}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
              {detailEntry.mode === 'hira' ? '히라가나' : '뜻'} · {relativeDate(detailEntry.created_at)}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: grade.color }}>{detailEntry.score}/{detailEntry.total}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>{pct}%</div>
          </div>
        </div>

        {/* 문제 목록 */}
        {detailEntry.questions.map((item, i) => {
          const isFav   = !!item.word_id && detailFavIds.has(item.word_id)
          const canFav  = !!item.word_id

          return (
            <div key={i} style={{
              background: item.isCorrect ? '#f0fff4' : '#fff5f5',
              border: `1.5px solid ${item.isCorrect ? '#c6f6d5' : '#fed7d7'}`,
              borderRadius: '12px', padding: '12px 14px',
              display: 'flex', flexDirection: 'column', gap: '6px',
            }}>
              {/* 번호 + 정오 + 즐겨찾기 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                  {i + 1}.
                </span>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, padding: '2px 8px',
                  borderRadius: '10px',
                  background: item.isCorrect ? '#c6f6d5' : '#fed7d7',
                  color: item.isCorrect ? '#276749' : '#c53030',
                }}>
                  {item.isCorrect ? '✓ 정답' : '✗ 오답'}
                </span>
                {canFav && (
                  <button
                    onClick={() => handleToggleDetailFav(item.word_id!)}
                    title={isFav ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                    style={{
                      marginLeft: 'auto',
                      width: '30px', height: '30px',
                      borderRadius: '50%',
                      border: `1.5px solid ${isFav ? '#f6d860' : 'var(--border)'}`,
                      background: isFav ? '#fffbeb' : 'var(--card-bg)',
                      color: isFav ? '#d97706' : 'var(--text-sub)',
                      fontSize: '1rem',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'background 0.15s, border-color 0.15s, color 0.15s',
                      flexShrink: 0,
                    }}
                  >
                    {isFav ? '★' : '☆'}
                  </button>
                )}
              </div>
              {/* 단어 */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>{item.jp}</span>
                {detailEntry.mode === 'meaning' && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>{item.hira}</span>
                )}
              </div>
              {/* 정답 */}
              <div style={{ fontSize: '0.82rem', color: '#276749', fontWeight: 600 }}>
                정답: {detailEntry.mode === 'hira' ? item.hira : item.ko}
              </div>
              {/* 오답 시: 선택한 답 */}
              {!item.isCorrect && (
                <div style={{ fontSize: '0.82rem', color: '#c53030' }}>
                  선택: {item.choices[item.selectedIndex]}
                </div>
              )}
            </div>
          )
        })}

        <div style={{ height: '8px' }} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 결과 화면
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const total = results.length
    const pct   = Math.round((score / total) * 100)
    const grade = getGrade(pct)
    const wrong = results.filter(r => !r.isCorrect)

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px', overflowY: 'auto' }}>

        {/* 점수 원형 */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingTop: '8px' }}>
          <div style={{
            width: '150px', height: '150px', borderRadius: '50%',
            background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--border) 0deg)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px var(--shadow)',
          }}>
            <div style={{
              width: '122px', height: '122px', borderRadius: '50%',
              background: 'var(--card-bg)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            }}>
              <div style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                {score}<span style={{ fontSize: '0.95rem', opacity: 0.6 }}>/{total}</span>
              </div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-sub)' }}>{pct}%</div>
            </div>
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: grade.color }}>{grade.label}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            {selectedSet?.name} · {mode === 'hira' ? '히라가나 맞추기' : '뜻 맞추기'}
          </div>
        </div>

        {/* 틀린 단어 요약 */}
        {wrong.length > 0 && (
          <div style={{ background: 'var(--card-bg)', borderRadius: '14px', padding: '14px', boxShadow: '0 2px 10px var(--shadow)' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '10px' }}>
              틀린 단어 {wrong.length}개
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {wrong.map((r, i) => (
                <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{r.question.word.jp}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--primary)' }}>{r.question.word.hira}</span>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-sub)' }}>{r.question.word.ko}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 저장 프롬프트 */}
        <div style={{
          background: 'var(--card-bg)', borderRadius: '14px',
          padding: '16px', boxShadow: '0 2px 10px var(--shadow)',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {saveStatus === 'prompt' && (
            <>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', textAlign: 'center' }}>
                📝 이 퀴즈 내역을 저장하시겠습니까?
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', textAlign: 'center' }}>
                최근 5건까지 저장되며 복습에 활용할 수 있습니다
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSave}
                  style={{ flex: 1, padding: '12px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer' }}
                >저장하기</button>
                <button
                  onClick={() => setSaveStatus('skipped')}
                  style={{ flex: 1, padding: '12px', background: 'var(--bg)', color: 'var(--text-sub)', border: '1.5px solid var(--border)', borderRadius: '10px', fontSize: '0.95rem', cursor: 'pointer' }}
                >건너뛰기</button>
              </div>
            </>
          )}
          {saveStatus === 'saving' && (
            <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.88rem', padding: '8px 0' }}>저장 중...</div>
          )}
          {saveStatus === 'saved' && (
            <div style={{ textAlign: 'center', color: '#276749', fontSize: '0.88rem', fontWeight: 600, padding: '8px 0' }}>
              ✓ 저장되었습니다
            </div>
          )}
          {saveStatus === 'skipped' && (
            <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.82rem', padding: '4px 0' }}>
              저장하지 않았습니다
            </div>
          )}
        </div>

        {/* 다시 하기 */}
        <button
          onClick={() => setPhase('config')}
          style={{ width: '100%', padding: '15px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
        >
          다시 하기
        </button>

        <div style={{ height: '8px' }} />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 세션 화면
  // ─────────────────────────────────────────────────────────────────────────
  if (phase === 'session') {
    const q        = questions[currentIdx]
    const answered = selectedChoice !== null
    const isLast   = currentIdx + 1 >= questions.length

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px' }}>

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
            {currentIdx + 1} / {questions.length}
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 700 }}>
            {score}점
          </span>
        </div>

        {/* 프로그레스 바 */}
        <div style={{ height: '5px', background: 'var(--border)', borderRadius: '3px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${((currentIdx + 1) / questions.length) * 100}%`, background: 'var(--primary)', borderRadius: '3px', transition: 'width 0.25s' }} />
        </div>

        {/* 문제 카드 */}
        <div style={{ background: 'var(--card-bg)', borderRadius: '18px', padding: '28px 20px', boxShadow: '0 4px 20px var(--shadow)', border: '1.5px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', minHeight: '130px', justifyContent: 'center' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 600, letterSpacing: '0.04em' }}>
            {mode === 'hira' ? '히라가나는?' : '뜻은?'}
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '0.05em' }}>
            {q.word.jp}
          </div>
          {mode === 'meaning' && (
            <div style={{ fontSize: '1rem', color: 'var(--primary)', fontWeight: 600 }}>{q.word.hira}</div>
          )}
        </div>

        {/* 선택지 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
          {q.choices.map((choice, i) => {
            const isCorrect  = i === q.correctIndex
            const isSelected = i === selectedChoice
            const bg     = answered && isCorrect ? '#f0fff4' : answered && isSelected ? '#fff5f5' : 'var(--card-bg)'
            const border = answered && isCorrect ? '#48bb78' : answered && isSelected ? '#e53e3e' : 'var(--border)'
            const color  = answered && isCorrect ? '#276749' : answered && isSelected ? '#e53e3e' : 'var(--text)'
            const badgeBg = answered && isCorrect ? '#48bb78' : answered && isSelected ? '#e53e3e' : 'var(--primary)'

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', background: bg, border: `1.5px solid ${border}`, borderRadius: '12px', cursor: answered ? 'default' : 'pointer', textAlign: 'left', transition: 'background 0.15s, border-color 0.15s' }}
              >
                <span style={{ width: '26px', height: '26px', borderRadius: '50%', background: badgeBg, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0 }}>
                  {LABELS[i]}
                </span>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color, wordBreak: 'break-all' }}>{choice}</span>
                {answered && isCorrect  && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✓</span>}
                {answered && isSelected && !isCorrect && <span style={{ marginLeft: 'auto', fontSize: '1.1rem' }}>✗</span>}
              </button>
            )
          })}
        </div>

        {/* 정답 후 */}
        {answered && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedChoice !== q.correctIndex && (
              <div style={{ padding: '10px 14px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '10px', fontSize: '0.82rem', color: '#9b2c2c' }}>
                정답: <b>{mode === 'hira' ? q.word.hira : q.word.ko}</b>
                {mode === 'hira' && <span style={{ color: 'var(--text-sub)', marginLeft: '8px' }}>({q.word.ko})</span>}
              </div>
            )}
            <button
              onClick={handleNext}
              style={{ width: '100%', padding: '14px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}
            >
              {isLast ? '결과 보기 →' : '다음 →'}
            </button>
          </div>
        )}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 설정 화면 (기본)
  // ─────────────────────────────────────────────────────────────────────────
  const maxWords    = selectedSet?.word_count ?? 0
  const parsedCount = parseInt(countInput) || 0
  const countValid  = order === 'sequential' || (parsedCount >= 1 && parsedCount <= maxWords)
  const canStart    = !!selectedSetId && countValid && !isLoading

  return (
    <div style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>

      {/* 최근 퀴즈 내역 */}
      {(historyLoading || history.length > 0) && (
        <ConfigSection title="📋 최근 퀴즈 내역">
          {historyLoading ? (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-sub)', textAlign: 'center', padding: '8px 0' }}>불러오는 중...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map(entry => {
                const pct   = Math.round((entry.score / entry.total) * 100)
                const grade = getGrade(pct)
                return (
                  <button
                    key={entry.id}
                    onClick={() => openDetail(entry)}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {entry.set_name}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginTop: '2px' }}>
                        {entry.mode === 'hira' ? '히라가나' : '뜻'} · {relativeDate(entry.created_at)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: grade.color }}>{entry.score}/{entry.total}</div>
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-sub)' }}>{pct}%</div>
                    </div>
                    <span style={{ color: 'var(--primary-light)', fontSize: '1rem', flexShrink: 0 }}>›</span>
                  </button>
                )
              })}
            </div>
          )}
        </ConfigSection>
      )}

      {/* 세트 선택 */}
      <ConfigSection title="세트 선택">
        {wordSets.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>등록된 단어 세트가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {wordSets.map(set => (
              <label key={set.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: selectedSetId === set.id ? 'var(--btn-bg)' : 'var(--card-bg)', border: `1.5px solid ${selectedSetId === set.id ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s' }}>
                <input type="radio" name="set" value={set.id} checked={selectedSetId === set.id} onChange={() => setSelectedSetId(set.id)} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text)' }}>{set.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{set.word_count ?? 0}개 단어</div>
                </div>
              </label>
            ))}
          </div>
        )}
      </ConfigSection>

      {/* 퀴즈 모드 */}
      <ConfigSection title="퀴즈 모드">
        <div style={{ display: 'flex', gap: '8px' }}>
          {([['hira', '히라가나 맞추기', '単→ひら'], ['meaning', '뜻 맞추기', '単+ひら→뜻']] as const).map(([v, label, sub]) => (
            <button key={v} onClick={() => setMode(v)} style={{ flex: 1, padding: '12px 8px', background: mode === v ? 'var(--primary)' : 'var(--card-bg)', color: mode === v ? '#fff' : 'var(--text)', border: `1.5px solid ${mode === v ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4, transition: 'background 0.15s, color 0.15s' }}>
              {label}
              <div style={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 400, marginTop: '2px' }}>{sub}</div>
            </button>
          ))}
        </div>
      </ConfigSection>

      {/* 문제 순서 */}
      <ConfigSection title="문제 순서">
        <div style={{ display: 'flex', gap: '8px' }}>
          {([['sequential', '저장순', '등록된 순서대로'], ['random', '랜덤', '섞어서 출제']] as const).map(([v, label, sub]) => (
            <button key={v} onClick={() => setOrder(v)} style={{ flex: 1, padding: '12px 8px', background: order === v ? 'var(--primary)' : 'var(--card-bg)', color: order === v ? '#fff' : 'var(--text)', border: `1.5px solid ${order === v ? 'var(--primary)' : 'var(--border)'}`, borderRadius: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.4, transition: 'background 0.15s, color 0.15s' }}>
              {label}
              <div style={{ fontSize: '0.7rem', opacity: 0.75, fontWeight: 400, marginTop: '2px' }}>{sub}</div>
            </button>
          ))}
        </div>
        {order === 'random' && (
          <div style={{ marginTop: '10px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', marginBottom: '6px', display: 'block' }}>문제 수 (최대 {maxWords}개)</label>
            <input
              type="number" value={countInput} min={1} max={maxWords}
              onChange={e => setCountInput(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px 12px', border: `1.5px solid ${countValid ? 'var(--border)' : '#e53e3e'}`, borderRadius: '8px', fontSize: '1rem', outline: 'none', color: 'var(--text)' }}
            />
            {!countValid && parsedCount > 0 && (
              <p style={{ fontSize: '0.75rem', color: '#e53e3e', marginTop: '4px' }}>1 ~ {maxWords} 사이의 숫자를 입력하세요</p>
            )}
          </div>
        )}
      </ConfigSection>

      {loadError && <p style={{ fontSize: '0.82rem', color: '#e53e3e', textAlign: 'center' }}>{loadError}</p>}

      <button
        onClick={handleStart}
        disabled={!canStart}
        style={{ width: '100%', padding: '16px', background: canStart ? 'var(--primary)' : 'var(--border)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1.05rem', fontWeight: 700, cursor: canStart ? 'pointer' : 'default', transition: 'background 0.15s' }}
      >
        {isLoading ? '불러오는 중...' : '퀴즈 시작 →'}
      </button>

      <div style={{ height: '8px' }} />
    </div>
  )
}

// ── 헬퍼 컴포넌트 ─────────────────────────────────────────────────────────────
function ConfigSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--card-bg)', borderRadius: '14px', padding: '16px', boxShadow: '0 2px 10px var(--shadow)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-sub)', letterSpacing: '0.04em' }}>{title}</div>
      {children}
    </div>
  )
}
