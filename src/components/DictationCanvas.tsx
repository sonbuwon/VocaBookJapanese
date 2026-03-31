'use client'

import { useRef, useEffect, useState } from 'react'
import type { StudyType } from '@/types'

interface Props {
  jp: string
  studyType: StudyType
  onClose: () => void
}

type Tool = 'pen' | 'eraser'

export default function DictationCanvas({ jp, studyType, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tool, setTool] = useState<Tool>('pen')
  const drawing = useRef(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const getPos = (e: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: ((e as MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as MouseEvent).clientY - rect.top) * scaleY,
    }
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      drawing.current = true
      lastPos.current = getPos(e, canvas)
    }

    const draw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault()
      if (!drawing.current || !lastPos.current) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      const pos = getPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      if (tool === 'pen') {
        ctx.globalCompositeOperation = 'source-over'
        ctx.strokeStyle = '#1a1a2e'
        ctx.lineWidth = 4
      } else {
        ctx.globalCompositeOperation = 'destination-out'
        ctx.lineWidth = 28
      }
      ctx.stroke()
      lastPos.current = pos
    }

    const endDraw = () => {
      drawing.current = false
      lastPos.current = null
    }

    canvas.addEventListener('mousedown', startDraw)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', endDraw)
    canvas.addEventListener('mouseleave', endDraw)
    canvas.addEventListener('touchstart', startDraw, { passive: false })
    canvas.addEventListener('touchmove', draw, { passive: false })
    canvas.addEventListener('touchend', endDraw)

    return () => {
      canvas.removeEventListener('mousedown', startDraw)
      canvas.removeEventListener('mousemove', draw)
      canvas.removeEventListener('mouseup', endDraw)
      canvas.removeEventListener('mouseleave', endDraw)
      canvas.removeEventListener('touchstart', startDraw)
      canvas.removeEventListener('touchmove', draw)
      canvas.removeEventListener('touchend', endDraw)
    }
  }, [tool])

  const isSent = studyType === 'sent'

  const btnStyle = (active: boolean): React.CSSProperties => ({
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: '1.5px solid',
    borderColor: active ? 'var(--primary)' : 'var(--border)',
    background: active ? 'var(--primary)' : 'transparent',
    color: active ? '#fff' : 'var(--text)',
    fontSize: '1.1rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  })

  return (
    <div style={{
      marginTop: '14px',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1.5px solid var(--border)',
      background: 'var(--card-bg)',
      boxShadow: '0 2px 12px var(--shadow)',
    }}>
      {/* 캔버스 영역 */}
      <div style={{ position: 'relative', width: '100%', height: '220px', background: '#fafafa' }}>
        {/* 가이드 텍스트 (회색 배경) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: isSent ? '1.2rem' : '4.67rem',
          fontWeight: 700,
          color: 'rgba(0,0,0,0.07)',
          userSelect: 'none',
          pointerEvents: 'none',
          padding: '12px',
          textAlign: 'center',
          wordBreak: 'break-all',
          lineHeight: 1.3,
          fontFamily: 'serif',
        }}>
          {jp}
        </div>
        {/* 드로잉 캔버스 */}
        <canvas
          ref={canvasRef}
          width={800}
          height={440}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: tool === 'pen' ? 'crosshair' : 'cell',
            touchAction: 'none',
          }}
        />
      </div>

      {/* 툴바 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '10px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--card-bg)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}>
        <button onClick={() => setTool('pen')} style={btnStyle(tool === 'pen')} title="펜">✏️</button>
        <button onClick={() => setTool('eraser')} style={btnStyle(tool === 'eraser')} title="지우개">🧹</button>
        <button onClick={clearCanvas} style={btnStyle(false)} title="전체 지우기">🗑️</button>
        <button
          onClick={onClose}
          style={{ ...btnStyle(false), marginLeft: 'auto' }}
          title="닫기"
        >✕</button>
      </div>
    </div>
  )
}
