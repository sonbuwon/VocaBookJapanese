'use client'

import { useEffect, useRef, useState } from 'react'

interface SpeakButtonProps {
  hira: string
}

export default function SpeakButton({ hira }: SpeakButtonProps) {
  const [ttsSupported, setTtsSupported] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const jaVoiceRef = useRef<SpeechSynthesisVoice | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTtsSupported(true)

      const loadJaVoice = () => {
        const voices = window.speechSynthesis.getVoices()
        jaVoiceRef.current = voices.find(v => v.lang.startsWith('ja')) ?? null
      }

      loadJaVoice()
      window.speechSynthesis.onvoiceschanged = loadJaVoice
    }
  }, [])

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!ttsSupported) return

    window.speechSynthesis.cancel()

    const utter = new SpeechSynthesisUtterance(hira)
    utter.lang = 'ja-JP'
    utter.rate = 0.85
    utter.pitch = 1.0
    if (jaVoiceRef.current) utter.voice = jaVoiceRef.current

    setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    utter.onerror = () => setSpeaking(false)

    window.speechSynthesis.speak(utter)
  }

  if (!ttsSupported) return null

  return (
    <button
      className={`speak-btn${speaking ? ' speaking' : ''}`}
      onClick={handleSpeak}
      title="발음 듣기"
      style={{
        marginTop: '10px',
        width: '46px',
        height: '46px',
        borderRadius: '50%',
        border: '1.5px solid var(--border)',
        background: 'var(--btn-bg)',
        color: 'var(--primary)',
        fontSize: '1.3rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px var(--shadow)',
        transition: 'background 0.15s, color 0.15s, transform 0.1s',
        flexShrink: 0,
      }}
    >
      🔈
    </button>
  )
}
