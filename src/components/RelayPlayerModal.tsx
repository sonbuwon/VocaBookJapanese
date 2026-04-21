'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Word } from '@/types'

interface RelayPlayerModalProps {
  words: Word[]
  setName: string
  onClose: () => void
}

type Phase = 'config' | 'playing' | 'finished'

export default function RelayPlayerModal({ words, setName, onClose }: RelayPlayerModalProps) {
  const [reps, setReps] = useState<1 | 2 | 3>(1)
  const [phase, setPhase] = useState<Phase>('config')
  const [isPaused, setIsPaused] = useState(false)
  const [currentWordIdx, setCurrentWordIdx] = useState(0)
  const [currentRep, setCurrentRep] = useState(1)
  const [currentLang, setCurrentLang] = useState<'jp' | 'ko'>('jp')
  const [ttsSupported, setTtsSupported] = useState(false)

  const playingRef = useRef(false)
  const jaVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const koVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const wordsRef = useRef(words)
  const iosTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    wordsRef.current = words
  }, [words])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    setTtsSupported(true)

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices()
      jaVoiceRef.current = voices.find(v => v.lang.startsWith('ja')) ?? null
      koVoiceRef.current = voices.find(v => v.lang.startsWith('ko')) ?? null
    }

    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices

    return () => {
      window.speechSynthesis.cancel()
      if (iosTimerRef.current) clearInterval(iosTimerRef.current)
    }
  }, [])

  // JP → KO 간 딜레이(ms)
  const JP_TO_KO_DELAY = 350
  // KO → 다음 JP 간 딜레이(ms) — 같은 단어 반복 시
  const SAME_WORD_DELAY = 550
  // 단어 간 딜레이(ms)
  const NEXT_WORD_DELAY = 900

  const playSegment = useCallback(
    (wordIdx: number, rep: number, lang: 'jp' | 'ko', totalReps: number) => {
      if (!playingRef.current) return

      const word = wordsRef.current[wordIdx]
      if (!word) return

      const text = lang === 'jp' ? word.hira : word.ko
      const langCode = lang === 'jp' ? 'ja-JP' : 'ko-KR'
      const voice = lang === 'jp' ? jaVoiceRef.current : koVoiceRef.current

      setCurrentWordIdx(wordIdx)
      setCurrentRep(rep)
      setCurrentLang(lang)

      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = langCode
      utter.rate = 0.85
      utter.pitch = 1.0
      if (voice) utter.voice = voice

      utter.onend = () => {
        if (!playingRef.current) return

        if (lang === 'jp') {
          // 일본어 끝 → 한국어
          setTimeout(() => playSegment(wordIdx, rep, 'ko', totalReps), JP_TO_KO_DELAY)
        } else {
          // 한국어 끝 → 다음 결정
          if (rep < totalReps) {
            // 같은 단어 다음 회차
            setTimeout(() => playSegment(wordIdx, rep + 1, 'jp', totalReps), SAME_WORD_DELAY)
          } else if (wordIdx < wordsRef.current.length - 1) {
            // 다음 단어
            setTimeout(() => playSegment(wordIdx + 1, 1, 'jp', totalReps), NEXT_WORD_DELAY)
          } else {
            // 전체 완료
            playingRef.current = false
            if (iosTimerRef.current) clearInterval(iosTimerRef.current)
            setPhase('finished')
          }
        }
      }

      utter.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') return
        // 오류 발생 시 다음 단어로 건너뜀
        if (playingRef.current) {
          setTimeout(() => {
            const nextLang = lang === 'jp' ? 'ko' : 'jp'
            const nextIdx = lang === 'ko' ? wordIdx + 1 : wordIdx
            if (nextIdx < wordsRef.current.length) {
              playSegment(nextIdx, rep, nextLang === 'jp' ? 'jp' : 'jp', totalReps)
            }
          }, 300)
        }
      }

      window.speechSynthesis.speak(utter)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const handleStart = () => {
    if (!ttsSupported || words.length === 0) return
    window.speechSynthesis.cancel()

    playingRef.current = true
    setPhase('playing')
    setIsPaused(false)
    setCurrentWordIdx(0)
    setCurrentRep(1)
    setCurrentLang('jp')

    // iOS에서 15초 후 음성 합성이 멈추는 버그 우회
    iosTimerRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    }, 8000)

    playSegment(0, 1, 'jp', reps)
  }

  const handlePause = () => {
    if (!window.speechSynthesis.speaking || window.speechSynthesis.paused) return
    window.speechSynthesis.pause()
    setIsPaused(true)
  }

  const handleResume = () => {
    if (!window.speechSynthesis.paused) return
    window.speechSynthesis.resume()
    setIsPaused(false)
  }

  const handleStop = () => {
    playingRef.current = false
    window.speechSynthesis.cancel()
    if (iosTimerRef.current) clearInterval(iosTimerRef.current)
    setPhase('config')
    setIsPaused(false)
  }

  const handleClose = () => {
    playingRef.current = false
    window.speechSynthesis.cancel()
    if (iosTimerRef.current) clearInterval(iosTimerRef.current)
    onClose()
  }

  const currentWord = words[currentWordIdx]
  const progressPct = words.length > 0
    ? ((currentWordIdx + (currentLang === 'ko' ? 0.5 : 0)) / words.length) * 100
    : 0

  return (
    /* 배경 오버레이 */
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
      onClick={handleClose}
    >
      {/* 모달 패널 */}
      <div
        style={{
          width: '100%',
          maxWidth: '480px',
          background: 'var(--card-bg)',
          borderRadius: '22px 22px 0 0',
          padding: '20px 20px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div style={{ width: '40px', height: '4px', borderRadius: '2px', background: 'var(--border)', margin: '0 auto -6px' }} />

        {/* 헤더 */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-sub)', marginBottom: '2px', letterSpacing: '0.05em', fontWeight: 600 }}>
              🔊 릴레이 음성
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {setName}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: '30px', height: '30px',
              borderRadius: '50%',
              border: '1.5px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--text-sub)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >✕</button>
        </div>

        {/* ── 설정 화면 ── */}
        {phase === 'config' && (
          <>
            <div style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.85rem', lineHeight: 1.6 }}>
              총 <strong style={{ color: 'var(--text)' }}>{words.length}개</strong> 단어를 일본어 → 한국어 순으로 재생합니다.<br />
              단어별 반복 횟수를 선택하세요.
            </div>

            {/* 반복 횟수 선택 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {([1, 2, 3] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setReps(n)}
                  style={{
                    flex: 1, padding: '16px 0',
                    borderRadius: '14px',
                    border: reps === n ? '2px solid var(--primary)' : '1.5px solid var(--border)',
                    background: reps === n ? 'var(--primary)' : 'var(--card-bg)',
                    color: reps === n ? '#fff' : 'var(--text)',
                    fontSize: '1.1rem', fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {n}회
                </button>
              ))}
            </div>

            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-sub)', textAlign: 'center' }}>
              {reps}회 선택 시 각 단어를 {reps}번씩 반복 후 다음 단어로 넘어갑니다.
            </p>

            <button
              onClick={handleStart}
              disabled={!ttsSupported || words.length === 0}
              style={{
                padding: '17px',
                background: ttsSupported ? 'var(--primary)' : 'var(--border)',
                color: '#fff',
                border: 'none', borderRadius: '14px',
                fontSize: '1.05rem', fontWeight: 700,
                cursor: ttsSupported && words.length > 0 ? 'pointer' : 'not-allowed',
                letterSpacing: '0.04em',
              }}
            >
              {!ttsSupported ? '음성 미지원 브라우저' : words.length === 0 ? '단어 없음' : '▶ 시작'}
            </button>
          </>
        )}

        {/* ── 재생 화면 ── */}
        {phase === 'playing' && currentWord && (
          <>
            {/* 진행 정보 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                {currentWordIdx + 1} / {words.length}
              </span>
              <div style={{ display: 'flex', gap: '5px' }}>
                {Array.from({ length: reps }).map((_, i) => (
                  <span
                    key={i}
                    style={{
                      width: '8px', height: '8px',
                      borderRadius: '50%',
                      background: i < currentRep ? 'var(--primary)' : 'var(--border)',
                      display: 'inline-block',
                      transition: 'background 0.2s',
                    }}
                  />
                ))}
                <span style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginLeft: '4px' }}>
                  {currentRep}/{reps}회
                </span>
              </div>
            </div>

            {/* 진행 바 */}
            <div style={{ height: '4px', borderRadius: '2px', background: 'var(--border)', overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                borderRadius: '2px',
                background: 'var(--primary)',
                width: `${progressPct}%`,
                transition: 'width 0.4s ease',
              }} />
            </div>

            {/* 단어 표시 */}
            <div style={{
              background: 'var(--bg)',
              borderRadius: '16px',
              padding: '20px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {/* 일본어 */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${currentLang === 'jp' && !isPaused ? '#90cdf4' : 'transparent'}`,
                background: currentLang === 'jp' && !isPaused ? '#e8f5ff' : 'transparent',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '1.8rem', fontWeight: 700,
                  color: currentLang === 'jp' ? '#1a6fb5' : 'var(--text)',
                  transition: 'color 0.25s',
                }}>
                  {currentWord.jp}
                </div>
                <div style={{
                  fontSize: '1rem', marginTop: '4px',
                  color: currentLang === 'jp' ? '#2b6cb0' : 'var(--text-sub)',
                  transition: 'color 0.25s',
                }}>
                  {currentWord.hira}
                </div>
                {currentLang === 'jp' && !isPaused && (
                  <div style={{ fontSize: '0.72rem', color: '#2b6cb0', marginTop: '6px', fontWeight: 600 }}>
                    🔊 일본어 재생 중
                  </div>
                )}
              </div>

              {/* 한국어 */}
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: `1.5px solid ${currentLang === 'ko' && !isPaused ? '#9ae6b4' : 'transparent'}`,
                background: currentLang === 'ko' && !isPaused ? '#f0fff4' : 'transparent',
                transition: 'all 0.25s',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '1.5rem', fontWeight: 600,
                  color: currentLang === 'ko' ? '#276749' : 'var(--text)',
                  transition: 'color 0.25s',
                }}>
                  {currentWord.ko}
                </div>
                {currentLang === 'ko' && !isPaused && (
                  <div style={{ fontSize: '0.72rem', color: '#276749', marginTop: '6px', fontWeight: 600 }}>
                    🔊 한국어 재생 중
                  </div>
                )}
              </div>
            </div>

            {/* 일시정지 표시 */}
            {isPaused && (
              <div style={{
                textAlign: 'center',
                color: 'var(--text-sub)',
                fontSize: '0.85rem',
                fontWeight: 600,
                padding: '6px',
                background: 'var(--bg)',
                borderRadius: '8px',
              }}>
                ⏸ 일시정지됨
              </div>
            )}

            {/* 컨트롤 버튼 */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {isPaused ? (
                <button
                  onClick={handleResume}
                  style={{
                    flex: 1, padding: '15px',
                    background: 'var(--primary)', color: '#fff',
                    border: 'none', borderRadius: '12px',
                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ▶ 재개
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  style={{
                    flex: 1, padding: '15px',
                    background: 'var(--btn-bg)', color: 'var(--primary)',
                    border: '1.5px solid var(--primary-light)', borderRadius: '12px',
                    fontSize: '1rem', fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  ⏸ 일시정지
                </button>
              )}
              <button
                onClick={handleStop}
                style={{
                  padding: '15px 18px',
                  background: '#fff5f5', color: '#e53e3e',
                  border: '1.5px solid #fed7d7', borderRadius: '12px',
                  fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                ■ 정지
              </button>
            </div>
          </>
        )}

        {/* ── 완료 화면 ── */}
        {phase === 'finished' && (
          <>
            <div style={{
              textAlign: 'center',
              padding: '16px 0 8px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
            }}>
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)' }}>완료!</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.6 }}>
                {words.length}개 단어 · {reps}회 반복 재생 완료
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setPhase('config')}
                style={{
                  flex: 1, padding: '15px',
                  background: 'var(--btn-bg)', color: 'var(--primary)',
                  border: '1.5px solid var(--primary-light)', borderRadius: '12px',
                  fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                다시 설정
              </button>
              <button
                onClick={handleClose}
                style={{
                  flex: 1, padding: '15px',
                  background: 'var(--primary)', color: '#fff',
                  border: 'none', borderRadius: '12px',
                  fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
