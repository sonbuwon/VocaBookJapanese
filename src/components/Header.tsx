'use client'

import { signOut } from '@/app/login/actions'

interface HeaderProps {
  title: string
  showBack: boolean
  onBack: () => void
  showLogout?: boolean
  showHome?: boolean
  onHome?: () => void
  isDark?: boolean
  onToggleTheme?: () => void
}

export default function Header({ title, showBack, onBack, showLogout, showHome, onHome, isDark, onToggleTheme }: HeaderProps) {
  return (
    <header style={{
      width: '100%',
      background: 'var(--primary)',
      color: '#fff',
      padding: '18px 16px 14px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      position: 'relative',
    }}>
      {showBack ? (
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: '14px',
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '1.5rem',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '4px 6px',
            borderRadius: '6px',
          }}
        >
          ←
        </button>
      ) : (
        <button
          onClick={onToggleTheme}
          title={isDark ? '라이트 모드' : '다크 모드'}
          style={{
            position: 'absolute',
            left: '14px',
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: '#fff',
            fontSize: '1.0rem',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '5px 8px',
            borderRadius: '6px',
          }}
        >
          {isDark ? '☀' : '☾'}
        </button>
      )}
      <h1 style={{
        flex: 1,
        fontSize: '1.15rem',
        fontWeight: 700,
        letterSpacing: '0.04em',
        textAlign: 'center',
      }}>
        {title}
      </h1>
      {showLogout && (
        <form action={signOut} style={{ position: 'absolute', right: '14px' }}>
          <button
            type="submit"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: 'none',
              color: '#fff',
              fontSize: '0.78rem',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '5px 10px',
              borderRadius: '6px',
              letterSpacing: '0.02em',
            }}
          >
            로그아웃
          </button>
        </form>
      )}
      {showHome && (
        <button
          onClick={onHome}
          title="홈으로"
          style={{
            position: 'absolute',
            right: '14px',
            background: 'rgba(255,255,255,0.18)',
            border: 'none',
            color: '#fff',
            fontSize: '1.0rem',
            cursor: 'pointer',
            lineHeight: 1,
            padding: '6px 10px',
            borderRadius: '6px',
          }}
        >
          home
        </button>
      )}
    </header>
  )
}
